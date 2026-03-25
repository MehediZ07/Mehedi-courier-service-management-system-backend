import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

type HubType = 'LOCAL' | 'REGIONAL' | 'INTERNATIONAL';

const createHub = async (payload: { name: string; city: string; address: string; hubType?: HubType }) => {
  const existing = await prisma.hub.findFirst({
    where: { city: payload.city, hubType: payload.hubType || 'LOCAL' },
  });

  if (existing) {
    throw new AppError(status.CONFLICT, `A ${payload.hubType || 'LOCAL'} hub already exists in ${payload.city}.`);
  }

  return prisma.hub.create({
    data: {
      name: payload.name,
      city: payload.city,
      address: payload.address,
      hubType: payload.hubType || 'LOCAL',
    },
  });
};

const getAllHubs = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.hub, queryParams, {
    searchableFields: ['name', 'city', 'address'],
    filterableFields: ['hubType', 'isActive'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();
};

const getHubById = async (id: string) => {
  const hub = await prisma.hub.findUnique({ where: { id } });
  if (!hub) throw new AppError(status.NOT_FOUND, 'Hub not found.');
  return hub;
};

const getHubsByCity = async (city: string) => {
  return prisma.hub.findMany({
    where: { city: { equals: city, mode: 'insensitive' }, isActive: true },
    orderBy: { hubType: 'asc' },
  });
};

const getNearestHub = async (city: string, hubType?: HubType) => {
  const hub = await prisma.hub.findFirst({
    where: {
      city: { equals: city, mode: 'insensitive' },
      isActive: true,
      ...(hubType && { hubType }),
    },
    orderBy: { hubType: 'asc' }, // Prefer LOCAL over REGIONAL
  });

  if (!hub) {
    throw new AppError(status.NOT_FOUND, `No active hub found in ${city}.`);
  }

  return hub;
};

const updateHub = async (id: string, payload: { name?: string; address?: string; hubType?: HubType; isActive?: boolean }) => {
  const hub = await prisma.hub.findUnique({ where: { id } });
  if (!hub) throw new AppError(status.NOT_FOUND, 'Hub not found.');

  return prisma.hub.update({
    where: { id },
    data: payload,
  });
};

const deleteHub = async (id: string) => {
  const hub = await prisma.hub.findUnique({ where: { id } });
  if (!hub) throw new AppError(status.NOT_FOUND, 'Hub not found.');

  // Check if hub has active shipment legs
  const activeLegs = await prisma.shipmentLeg.count({
    where: {
      OR: [{ originHubId: id }, { destHubId: id }],
      status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
    },
  });

  if (activeLegs > 0) {
    throw new AppError(status.BAD_REQUEST, 'Cannot delete hub with active shipment legs. Please complete or reassign them first.');
  }

  await prisma.hub.delete({ where: { id } });
};

const getHubShipments = async (id: string, queryParams: IQueryParams) => {
  const hub = await prisma.hub.findUnique({ where: { id } });
  if (!hub) throw new AppError(status.NOT_FOUND, 'Hub not found.');

  return new QueryBuilder(prisma.shipmentLeg, queryParams, {
    filterableFields: ['status', 'legType'],
  })
    .where({
      OR: [{ originHubId: id }, { destHubId: id }],
    })
    .filter()
    .sort()
    .paginate()
    .include({
      shipment: {
        include: {
          sender: { select: { id: true, name: true, email: true } },
          pricing: true,
        },
      },
      courier: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    })
    .execute();
};

const getHubCities = async () => {
  const hubs = await prisma.hub.findMany({
    where: { isActive: true },
    select: { city: true },
    distinct: ['city'],
    orderBy: { city: 'asc' },
  });
  return hubs.map((h) => h.city);
};

export const HubService = {
  createHub,
  getAllHubs,
  getHubById,
  getHubsByCity,
  getNearestHub,
  updateHub,
  deleteHub,
  getHubShipments,
  getHubCities,
};
