
import Dexie, { type Table } from 'dexie';
import { Lead, NewsItem, SemanticProfile } from '../types';

export class BioSignalDB extends Dexie {
  profiles!: Table<SemanticProfile>;
  leads!: Table<Lead>;
  news!: Table<NewsItem>;

  constructor() {
    super('BioSignalNews_v1.04');
    (this as any).version(1).stores({
      profiles: 'id, timestamp',
      leads: 'id, companyName, status, timestamp',
      news: 'id, type, topic, jurisdiction, timestamp'
    });
  }
}

export const db = new BioSignalDB();
