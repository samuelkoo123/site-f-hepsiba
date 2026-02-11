
import { Inquiry, Resource, GuestbookEntry, Testimony, Sponsorship } from './types';

// 사용자의 실제 구글 앱스 스크립트 웹 앱 URL
const API_URL = 'https://script.google.com/macros/s/AKfycbyDM_YgQdq7b_id97x7W7mlyM49Wl-wbsMSg8ucs8Xf_As2TXDcfEZMmzwyUPASgFhXLQ/exec'; 

export const db = {
  async save(type: 'inquiry' | 'resource' | 'guestbook' | 'testimony' | 'sponsorship', payload: any): Promise<boolean> {
    if (!API_URL) return false;

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ dbCategory: type, ...payload })
      });
      return true; 
    } catch (e) {
      console.error('Save Error:', e);
      return false;
    }
  },

  async getAll(): Promise<{
    inquiries: Inquiry[],
    resources: Resource[],
    guestbook: GuestbookEntry[],
    testimonies: Testimony[],
    sponsorships: Sponsorship[]
  }> {
    const results = {
      inquiries: [] as Inquiry[],
      resources: [] as Resource[],
      guestbook: [] as GuestbookEntry[],
      testimonies: [] as Testimony[],
      sponsorships: [] as Sponsorship[]
    };

    if (!API_URL) return results;

    try {
      const response = await fetch(API_URL);
      const rawData = await response.json(); 

      if (Array.isArray(rawData)) {
        rawData.forEach((row) => {
          if (row.length >= 3) {
            try {
              const category = row[1]; // 구글 시트 2번째 열 (dbCategory)
              const item = JSON.parse(row[2]); // 3번째 열 (JSON 데이터)
              
              if (category === 'inquiry') results.inquiries.unshift(item);
              else if (category === 'resource') results.resources.unshift(item);
              else if (category === 'guestbook') results.guestbook.unshift(item);
              else if (category === 'testimony') results.testimonies.unshift(item);
              else if (category === 'sponsorship') results.sponsorships.unshift(item);
            } catch (parseErr) {
              // 헤더 혹은 파싱 오류 건너뛰기
            }
          }
        });
      }
    } catch (e) {
      console.error('Fetch Error:', e);
    }

    return results;
  },

  async delete(type: string, id: string): Promise<boolean> {
    if (!API_URL) return false;

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete', id, type })
      });
      return true;
    } catch (e) {
      console.error('Delete Error:', e);
      return false;
    }
  }
};
