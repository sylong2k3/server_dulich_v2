const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

const DATE_FORMAT = "YYYY-MM-DD";

dayjs.extend(utc);
dayjs.extend(timezone);

const toTzDate = (input, tz) => {
  if (!input) return dayjs().tz(tz);

  if (dayjs.isDayjs(input)) {
    return input.tz(tz);
  }

  if (input instanceof Date) {
    return dayjs(input).tz(tz);
  }

  return dayjs.tz(String(input), tz);
};

const formatDate = (input, tz) => toTzDate(input, tz).format(DATE_FORMAT);

const getToday = (tz) => dayjs().tz(tz).format(DATE_FORMAT);

const getNextDate = (dateStr, days, tz) =>
  toTzDate(dateStr, tz).add(days, "day").format(DATE_FORMAT);

const resolveScheduleType = (dateStr, tz) => {
  const date = toTzDate(dateStr, tz);
  const dayOfMonth = date.date();

  if (dayOfMonth === 1) return "day_1";
  if (dayOfMonth === 15) return "day_15";

  return null;
};

const buildBasePeriods = (scheduledDate, tz) => {
  const schedule = toTzDate(scheduledDate, tz);
  const scheduleType = resolveScheduleType(scheduledDate, tz);

  if (!scheduleType) {
    throw new Error(
      `scheduledDate ${scheduledDate} không thuộc mốc ngày 1 hoặc 15`,
    );
  }

  if (scheduleType === "day_1") {
    const previousMonth = schedule.subtract(1, "month");
    return {
      scheduleType,
      period1: {
        startDate: previousMonth.date(15).format(DATE_FORMAT),
        endDate: schedule.format(DATE_FORMAT),
      },
      period2: {
        startDate: previousMonth.date(1).format(DATE_FORMAT),
        endDate: previousMonth.date(15).format(DATE_FORMAT),
      },
    };
  }

  return {
    scheduleType,
    period1: {
      startDate: schedule.date(1).format(DATE_FORMAT),
      endDate: schedule.format(DATE_FORMAT),
    },
    period2: {
      startDate: schedule.subtract(1, "month").date(15).format(DATE_FORMAT),
      endDate: schedule.date(1).format(DATE_FORMAT),
    },
  };
};

const buildNextRetryPeriods = ({
  actualPeriod1Start,
  actualPeriod1End,
  actualPeriod2Start,
  actualPeriod2End,
  period1Failed,
  period2Failed,
  tz,
}) => {
  return {
    actualPeriod1Start,
    actualPeriod1End: period1Failed
      ? getNextDate(actualPeriod1End, 1, tz)
      : actualPeriod1End,
    actualPeriod2Start,
    actualPeriod2End: period2Failed
      ? getNextDate(actualPeriod2End, 5, tz)
      : actualPeriod2End,
  };
};

module.exports = {
  DATE_FORMAT,
  formatDate,
  getToday,
  getNextDate,
  resolveScheduleType,
  buildBasePeriods,
  buildNextRetryPeriods,
};
