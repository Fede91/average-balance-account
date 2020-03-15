import dayjs from "dayjs";

import { daysOfAYear } from "../utils/calendar";
import hashUtils from "../utils/hash";
import { Transaction, Balance, CreditorNumber } from "../types";

export const concatTransactions = (
  currentTransactions: Transaction[],
  newTransactions: Transaction[]
): Transaction[] => {
  const transactionsList = [...currentTransactions];
  for (let newTransaction of newTransactions) {
    if (
      !transactionsList.find(
        transaction => transaction.key === newTransaction.key
      )
    ) {
      transactionsList.push(newTransaction);
    }
  }
  return transactionsList;
};

export const toBalance = (date: string, amount: number): Balance => ({
  key: hashUtils.generate(JSON.stringify({ date, amount })),
  date,
  amount,
  totalAmount: amount
});

export const getBalancesByDate = (
  initialBalance: Balance,
  transactions: Transaction[]
): Balance[] => {
  return transactions.reduce(
    (balances: Balance[], transaction) => {
      if (transaction.date === balances[balances.length - 1].date) {
        balances[balances.length - 1].amount =
          balances[balances.length - 1].amount + transaction.amount;
        balances[balances.length - 1].totalAmount =
          balances[balances.length - 1].totalAmount + transaction.amount;
      } else {
        balances.push({
          ...transaction,
          totalAmount:
            balances[balances.length - 1].totalAmount + transaction.amount
        });
      }

      return balances;
    },
    [initialBalance]
  );
};

export const getCreditorNumbers = (balances: Balance[]): CreditorNumber[] => {
  return balances.reduce(
    (creditorNumbers: CreditorNumber[], balance, index, array) => {
      const nextDate =
        index + 1 < array.length ? array[index + 1].date : "2020-12-31";

      const date1 = dayjs(balance.date);
      const date2 = dayjs(nextDate);
      const diff = date2.diff(date1, "day");

      creditorNumbers.push({
        key: hashUtils.generate(JSON.stringify(balance)),
        numDays: diff,
        amount: balance.totalAmount,
        total: diff * balance.totalAmount
      });

      return creditorNumbers;
    },
    []
  );
};

export const getAnnualBalance = (creditorNumbers: CreditorNumber[]): number => {
  return creditorNumbers.reduce((totalBalance: number, creditorNumber) => {
    return totalBalance + creditorNumber.total;
  }, 0);
};

export const getAverageBalance = (totalBalance: number, year: number): number =>
  totalBalance / daysOfAYear(year);
