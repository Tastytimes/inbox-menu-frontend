/** User selected takeaway for this cart line */
export const isTakeawayItem = (item) => Boolean(item?.isParcel);

export const isDineInItem = (item) => !isTakeawayItem(item);

/** Food supports packaging (has a parcel charge configured) */
export const supportsTakeaway = (item) => Number(item?.parcelCharge) > 0;

export const getFoodCartCounts = (items, foodId) => {
  let dineIn = 0;
  let parcel = 0;

  (items ?? []).forEach((item) => {
    if (item.foodId !== foodId) return;
    const qty = item.quantity ?? 0;
    if (isTakeawayItem(item)) {
      parcel += qty;
    } else {
      dineIn += qty;
    }
  });

  return { dineIn, parcel };
};

export const findCartLine = (items, foodId, isParcel) =>
  (items ?? []).find(
    (item) => item.foodId === foodId && Boolean(item.isParcel) === isParcel
  );

export const getItemParcelTotal = (item) => {
  if (!isTakeawayItem(item)) return 0;
  if (item.lineParcelTotal != null) {
    return Number(item.lineParcelTotal);
  }
  if (!supportsTakeaway(item)) return 0;
  return Number(item.parcelCharge) * (item.quantity ?? 1);
};

export const countOrderTypes = (items = []) => {
  let takeaway = 0;
  let dineIn = 0;
  items.forEach((item) => {
    const qty = item.quantity ?? 0;
    if (isTakeawayItem(item)) {
      takeaway += qty;
    } else {
      dineIn += qty;
    }
  });
  return { takeaway, dineIn };
};
