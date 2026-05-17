import { ApiClient } from './api';

export const siteService = {
  getSites: async () => {
    // Simulated data
    return [
      { id: '1', title: 'Main Plant - South', zone: 'Zone A - Processing Unit', icon: '🏭' },
      { id: '2', title: 'Storage Facility B', zone: 'Logistics & Hazmat Sector', icon: '📦' },
      { id: '3', title: 'Offshore Platform Gamma', zone: 'Drilling Deck 4', icon: '🛢️' },
    ];
  },
  selectSite: async (siteId: string) => {
    return ApiClient.post(`/sites/${siteId}/select`, {});
  }
};
