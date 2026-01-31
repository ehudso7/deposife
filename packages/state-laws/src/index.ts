export interface StateLaw {
  state: string;
  stateCode: string;
  depositLimits: {
    maxMonthsRent: number;
    petDepositAllowed: boolean;
    lastMonthRentAllowed: boolean;
  };
  returnTimeline: {
    daysToReturn: number;
    daysToProvideItemizedList: number;
  };
  interestRequired: boolean;
  interestRate?: number;
  protectionRequired: boolean;
  protectionDeadline?: number;
  penalties: {
    lateReturn: string;
    nonCompliance: string;
  };
  notices: {
    moveInInspection: boolean;
    moveOutInspection: boolean;
    depositDisposition: boolean;
  };
  specialProvisions?: string[];
}

export const STATE_LAWS: Record<string, StateLaw> = {
  CA: {
    state: 'California',
    stateCode: 'CA',
    depositLimits: {
      maxMonthsRent: 2,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 21,
      daysToProvideItemizedList: 21,
    },
    interestRequired: false,
    protectionRequired: false,
    penalties: {
      lateReturn: '2x deposit amount plus actual damages',
      nonCompliance: 'Bad faith retention: 2x deposit amount',
    },
    notices: {
      moveInInspection: true,
      moveOutInspection: true,
      depositDisposition: true,
    },
    specialProvisions: [
      'Landlord must provide receipts for repairs over $126',
      'Pre-move out inspection required if tenant requests',
    ],
  },
  NY: {
    state: 'New York',
    stateCode: 'NY',
    depositLimits: {
      maxMonthsRent: 1,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 14,
      daysToProvideItemizedList: 14,
    },
    interestRequired: true,
    interestRate: 0.01,
    protectionRequired: false,
    penalties: {
      lateReturn: '2x deposit amount',
      nonCompliance: 'Punitive damages possible',
    },
    notices: {
      moveInInspection: true,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Deposit must be held in NY bank',
      'Interest required for buildings with 6+ units',
    ],
  },
  TX: {
    state: 'Texas',
    stateCode: 'TX',
    depositLimits: {
      maxMonthsRent: 999,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 30,
      daysToProvideItemizedList: 30,
    },
    interestRequired: false,
    protectionRequired: false,
    penalties: {
      lateReturn: '$100 plus 3x deposit amount',
      nonCompliance: 'Bad faith: $100 plus 3x deposit',
    },
    notices: {
      moveInInspection: false,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Tenant must provide forwarding address in writing',
      'No limit on deposit amount',
    ],
  },
  FL: {
    state: 'Florida',
    stateCode: 'FL',
    depositLimits: {
      maxMonthsRent: 999,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 15,
      daysToProvideItemizedList: 30,
    },
    interestRequired: true,
    interestRate: 0.05,
    protectionRequired: false,
    penalties: {
      lateReturn: 'Forfeiture of claim on deposit',
      nonCompliance: 'Tenant may recover deposit plus attorneys fees',
    },
    notices: {
      moveInInspection: false,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Interest required if held for 6+ months',
      'Must be held in separate account or post surety bond',
    ],
  },
  IL: {
    state: 'Illinois',
    stateCode: 'IL',
    depositLimits: {
      maxMonthsRent: 999,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 45,
      daysToProvideItemizedList: 30,
    },
    interestRequired: true,
    interestRate: 0.01,
    protectionRequired: false,
    penalties: {
      lateReturn: '2x deposit amount plus attorneys fees',
      nonCompliance: 'Damages plus court costs',
    },
    notices: {
      moveInInspection: false,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Interest required for buildings with 25+ units',
      'Receipts required for repairs',
    ],
  },
  WA: {
    state: 'Washington',
    stateCode: 'WA',
    depositLimits: {
      maxMonthsRent: 1,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 21,
      daysToProvideItemizedList: 21,
    },
    interestRequired: false,
    protectionRequired: false,
    penalties: {
      lateReturn: '2x deposit amount',
      nonCompliance: 'Up to 2x deposit in damages',
    },
    notices: {
      moveInInspection: true,
      moveOutInspection: true,
      depositDisposition: true,
    },
    specialProvisions: [
      'Checklist required at move-in and move-out',
      'Deposit must be held in trust account',
    ],
  },
  MA: {
    state: 'Massachusetts',
    stateCode: 'MA',
    depositLimits: {
      maxMonthsRent: 1,
      petDepositAllowed: false,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 30,
      daysToProvideItemizedList: 30,
    },
    interestRequired: true,
    interestRate: 0.05,
    protectionRequired: false,
    penalties: {
      lateReturn: '3x deposit amount plus attorneys fees',
      nonCompliance: '3x deposit plus interest and attorneys fees',
    },
    notices: {
      moveInInspection: true,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Separate interest-bearing account required',
      'Annual interest payments required',
      'Receipt required within 30 days',
    ],
  },
  PA: {
    state: 'Pennsylvania',
    stateCode: 'PA',
    depositLimits: {
      maxMonthsRent: 2,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 30,
      daysToProvideItemizedList: 30,
    },
    interestRequired: true,
    interestRate: 0.01,
    protectionRequired: false,
    penalties: {
      lateReturn: '2x deposit amount',
      nonCompliance: 'Double damages plus attorneys fees',
    },
    notices: {
      moveInInspection: false,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Interest required after 2 years',
      'Escrow account required for deposits over 1 month rent',
    ],
  },
  GA: {
    state: 'Georgia',
    stateCode: 'GA',
    depositLimits: {
      maxMonthsRent: 2,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 30,
      daysToProvideItemizedList: 30,
    },
    interestRequired: false,
    protectionRequired: false,
    penalties: {
      lateReturn: '3x deposit amount',
      nonCompliance: 'Triple damages plus attorneys fees',
    },
    notices: {
      moveInInspection: true,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Move-in inspection list required',
      'Tenant has right to be present at move-out inspection',
    ],
  },
  NC: {
    state: 'North Carolina',
    stateCode: 'NC',
    depositLimits: {
      maxMonthsRent: 2,
      petDepositAllowed: true,
      lastMonthRentAllowed: true,
    },
    returnTimeline: {
      daysToReturn: 30,
      daysToProvideItemizedList: 30,
    },
    interestRequired: false,
    protectionRequired: true,
    protectionDeadline: 30,
    penalties: {
      lateReturn: 'Forfeiture of right to withhold any portion',
      nonCompliance: 'Tenant may recover full deposit',
    },
    notices: {
      moveInInspection: false,
      moveOutInspection: false,
      depositDisposition: true,
    },
    specialProvisions: [
      'Deposit must be in trust account or bond posted',
      'Landlord may be liable for damages if not protected',
    ],
  },
};

export const getStateLaw = (stateCode: string): StateLaw | undefined => {
  return STATE_LAWS[stateCode.toUpperCase()];
};

export const getDepositLimit = (stateCode: string, monthlyRent: number): number => {
  const law = getStateLaw(stateCode);
  if (!law) return monthlyRent * 2;

  const maxMonths = law.depositLimits.maxMonthsRent;
  return maxMonths === 999 ? Number.MAX_SAFE_INTEGER : monthlyRent * maxMonths;
};

export const getReturnDeadline = (stateCode: string, moveOutDate: Date): Date => {
  const law = getStateLaw(stateCode);
  const days = law?.returnTimeline.daysToReturn || 30;

  const deadline = new Date(moveOutDate);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
};

export const isInterestRequired = (stateCode: string): boolean => {
  const law = getStateLaw(stateCode);
  return law?.interestRequired || false;
};

export const getInterestRate = (stateCode: string): number => {
  const law = getStateLaw(stateCode);
  return law?.interestRate || 0;
};

export const isProtectionRequired = (stateCode: string): boolean => {
  const law = getStateLaw(stateCode);
  return law?.protectionRequired || false;
};

export const getProtectionDeadline = (stateCode: string, leaseStartDate: Date): Date | null => {
  const law = getStateLaw(stateCode);
  if (!law?.protectionRequired || !law.protectionDeadline) return null;

  const deadline = new Date(leaseStartDate);
  deadline.setDate(deadline.getDate() + law.protectionDeadline);
  return deadline;
};

export const validateDepositAmount = (
  stateCode: string,
  depositAmount: number,
  monthlyRent: number
): { valid: boolean; maxAllowed?: number; message?: string } => {
  const maxAllowed = getDepositLimit(stateCode, monthlyRent);

  if (depositAmount > maxAllowed) {
    return {
      valid: false,
      maxAllowed,
      message: `Deposit exceeds state limit of ${maxAllowed === Number.MAX_SAFE_INTEGER ? 'no limit' : `${Math.floor(maxAllowed / monthlyRent)} months rent`}`,
    };
  }

  return { valid: true };
};

export const getAllStates = (): string[] => {
  return Object.keys(STATE_LAWS);
};

export const getStatesByFeature = (feature: keyof Pick<StateLaw, 'interestRequired' | 'protectionRequired'>): string[] => {
  return Object.entries(STATE_LAWS)
    .filter(([, law]) => law[feature])
    .map(([code]) => code);
};