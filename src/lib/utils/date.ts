const MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

const PUBLISH_DATE_PATTERN = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/;

export type PublishDateParts = {
    month: string;
    day: string;
    year: string;

    label: string;

    full: string;
};

export const parsePublishDate = (value: string): PublishDateParts => {
    const match = PUBLISH_DATE_PATTERN.exec(value.trim());

    if (!match) {
        return {
            month: value,
            day: "",
            year: "",
            label: value,
            full: value,
        };
    }

    const [, rawMonth, rawDay, year] = match;
    const month = MONTH_LABELS.find(
        (label) => label.toLowerCase() === rawMonth.slice(0, 3).toLowerCase(),
    );

    if (!month) {
        return {
            month: value,
            day: "",
            year: "",
            label: value,
            full: value,
        };
    }

    const day = String(Number(rawDay));

    return {
        month,
        day,
        year,
        label: `${month} ${day}`,
        full: `${day.padStart(2, "0")} ${month} ${year}`,
    };
};

export const toIsoDate = (value: string): string | null => {
    const match = PUBLISH_DATE_PATTERN.exec(value.trim());

    if (!match) {
        return null;
    }

    const [, rawMonth, rawDay, year] = match;
    const monthIndex = MONTH_LABELS.findIndex(
        (label) => label.toLowerCase() === rawMonth.slice(0, 3).toLowerCase(),
    );
    const day = Number(rawDay);

    if (monthIndex === -1 || day < 1 || day > 31) {
        return null;
    }

    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};
