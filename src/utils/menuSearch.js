const normalize = (value) => String(value || "").toLowerCase().trim();

export const filterMenuCategories = (categories, query) => {
  const q = normalize(query);
  if (!q) {
    return (categories ?? []).map((category) => ({
      ...category,
      foodItems: category.foodItems ?? [],
    }));
  }

  return (categories ?? [])
    .map((category) => {
      const categoryMatched =
        normalize(category.categoryName).includes(q) ||
        normalize(category.description).includes(q);

      if (categoryMatched) {
        return { ...category, foodItems: category.foodItems ?? [] };
      }

      const foodItems = (category.foodItems ?? []).filter((item) =>
        [item.name, item.description, item.foodType, item.categoryName]
          .map(normalize)
          .some((value) => value.includes(q))
      );

      return { ...category, foodItems };
    })
    .filter((category) => (category.foodItems ?? []).length > 0);
};

export const countMenuItems = (categories) =>
  (categories ?? []).reduce((sum, category) => sum + (category.foodItems ?? []).length, 0);
