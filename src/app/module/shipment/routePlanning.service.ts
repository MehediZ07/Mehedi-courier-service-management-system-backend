import { HubService } from '../hub/hub.service.js';

type RegionType = 'LOCAL' | 'NATIONAL' | 'INTERNATIONAL';
type Priority = 'STANDARD' | 'EXPRESS';
type DeliveryType = 'LEGACY_DIRECT' | 'DIRECT' | 'HUB_BASED';
type LegType = 'DIRECT' | 'PICKUP' | 'HUB_TRANSFER' | 'DELIVERY';

interface ShipmentData {
  pickupAddress: string;
  pickupCity: string;
  deliveryAddress: string;
  deliveryCity: string;
  weight: number;
  priority: Priority;
  regionType: RegionType;
}

interface LegPlan {
  legNumber: number;
  legType: LegType;
  originType: 'ADDRESS' | 'HUB';
  originAddress?: string;
  originHubId?: string;
  destType: 'ADDRESS' | 'HUB';
  destAddress?: string;
  destHubId?: string;
}

export const determineDeliveryType = (regionType: RegionType): DeliveryType => {
  if (regionType === 'LOCAL') return 'DIRECT';
  return 'HUB_BASED';
};

export const planShipmentRoute = async (shipmentData: ShipmentData): Promise<LegPlan[]> => {
  const { pickupCity, deliveryCity, regionType } = shipmentData;

  if (regionType === 'LOCAL') {
    return [
      {
        legNumber: 1,
        legType: 'DIRECT',
        originType: 'ADDRESS',
        originAddress: shipmentData.pickupAddress,
        destType: 'ADDRESS',
        destAddress: shipmentData.deliveryAddress,
      },
    ];
  }

  if (regionType === 'NATIONAL') {
    const originHub = await HubService.getNearestHub(pickupCity);
    const destHub = await HubService.getNearestHub(deliveryCity);

    return [
      {
        legNumber: 1,
        legType: 'PICKUP',
        originType: 'ADDRESS',
        originAddress: shipmentData.pickupAddress,
        destType: 'HUB',
        destHubId: originHub.id,
      },
      {
        legNumber: 2,
        legType: 'HUB_TRANSFER',
        originType: 'HUB',
        originHubId: originHub.id,
        destType: 'HUB',
        destHubId: destHub.id,
      },
      {
        legNumber: 3,
        legType: 'DELIVERY',
        originType: 'HUB',
        originHubId: destHub.id,
        destType: 'ADDRESS',
        destAddress: shipmentData.deliveryAddress,
      },
    ];
  }

  if (regionType === 'INTERNATIONAL') {
    const originHub = await HubService.getNearestHub(pickupCity, 'INTERNATIONAL');
    const destHub = await HubService.getNearestHub(deliveryCity, 'INTERNATIONAL');

    return [
      {
        legNumber: 1,
        legType: 'PICKUP',
        originType: 'ADDRESS',
        originAddress: shipmentData.pickupAddress,
        destType: 'HUB',
        destHubId: originHub.id,
      },
      {
        legNumber: 2,
        legType: 'HUB_TRANSFER',
        originType: 'HUB',
        originHubId: originHub.id,
        destType: 'HUB',
        destHubId: originHub.id,
      },
      {
        legNumber: 3,
        legType: 'HUB_TRANSFER',
        originType: 'HUB',
        originHubId: originHub.id,
        destType: 'HUB',
        destHubId: destHub.id,
      },
      {
        legNumber: 4,
        legType: 'HUB_TRANSFER',
        originType: 'HUB',
        originHubId: destHub.id,
        destType: 'HUB',
        destHubId: destHub.id,
      },
      {
        legNumber: 5,
        legType: 'DELIVERY',
        originType: 'HUB',
        originHubId: destHub.id,
        destType: 'ADDRESS',
        destAddress: shipmentData.deliveryAddress,
      },
    ];
  }

  return [
    {
      legNumber: 1,
      legType: 'DIRECT',
      originType: 'ADDRESS',
      originAddress: shipmentData.pickupAddress,
      destType: 'ADDRESS',
      destAddress: shipmentData.deliveryAddress,
    },
  ];
};

export const getLegDescription = (leg: LegPlan, originHubName?: string, destHubName?: string): string => {
  switch (leg.legType) {
    case 'DIRECT':
      return `Direct delivery from pickup to destination`;
    case 'PICKUP':
      return `Pickup from sender to ${destHubName || 'hub'}`;
    case 'HUB_TRANSFER':
      return `Transfer from ${originHubName || 'origin hub'} to ${destHubName || 'destination hub'}`;
    case 'DELIVERY':
      return `Delivery from ${originHubName || 'hub'} to recipient`;
    default:
      return 'Unknown leg type';
  }
};

export const RoutePlanningService = {
  determineDeliveryType,
  planShipmentRoute,
  getLegDescription,
};
