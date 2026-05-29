/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type Table } from 'dexie';
import { Account, Transaction } from './types';

export interface Setting {
  key: string;
  value: any;
}

export class WealthDb extends Dexie {
  accounts!: Table<Account>;
  transactions!: Table<Transaction>;
  settings!: Table<Setting>;

  constructor() {
    super('WealthSnapDB');
    
    // Schema definition for Dexie
    // version 2 to include settings
    this.version(2).stores({
      accounts: 'id, name, type, openingDate',
      transactions: 'id, accountId, type, category, date',
      settings: 'key'
    });
  }
}

export const db = new WealthDb();
