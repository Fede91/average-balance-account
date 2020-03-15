import months from "../config/months";
import hashUtils from "./hash";
import {
  CalendarLanguages as EnumCalendarLanguages,
  Transaction as TypeTransaction
} from "../types";

const REVOLUT_EXCEL_HEADER =
  "Completed Date;Reference;Paid Out (EUR);Paid In (EUR);Exchange Out;Exchange In; Balance (EUR);Exchange Rate;Category";

const normalizeRawData = (
  lang: EnumCalendarLanguages,
  year: number,
  rawData: string
): TypeTransaction[] | null => {
  if (rawData.indexOf(REVOLUT_EXCEL_HEADER) < 0) {
    return null;
  }
  let rawRows = rawData.split("\n");
  rawRows.shift();
  rawRows = rawRows.reverse().filter(row => row.length > 0);

  return rawRows.reduce((previousValue: TypeTransaction[], currentValue) => {
    const data = currentValue.split(";");

    const rawDate = data[0].split(" ");
    const currentMonth = rawDate[1].substr(0, 3);

    const date = `${rawDate.length === 3 ? rawDate[2] : year}-${(
      months[lang].indexOf(currentMonth) + 1
    )
      .toString()
      .padStart(2, "0")}-${rawDate[0].padStart(2, "0")}`;

    const amount = data[2]
      ? parseFloat(data[2].replace(",", ".")) < 0
        ? parseFloat(data[2].replace(",", "."))
        : parseFloat(data[2].replace(",", ".")) * -1
      : parseFloat(data[3].replace(",", "."));

    const obj = {
      key: hashUtils.generate(JSON.stringify({ date, amount })),
      date,
      amount
    };

    previousValue.push(obj);

    return previousValue;
  }, []);
};

export default {
  normalizeRawData
};
