import { adminClient } from "./adminApi";

export const extractRestaurantMenuFromImage = async (clientId, file) => {
  return extractRestaurantMenuFromImages(clientId, [file]);
};

export const extractRestaurantMenuFromImages = async (clientId, files) => {
  const validFiles = (files ?? []).filter(Boolean);
  if (!validFiles.length) {
    throw new Error("At least one menu image is required");
  }

  const formData = new FormData();
  const fieldName = validFiles.length === 1 ? "file" : "files";
  for (const file of validFiles) {
    formData.append(fieldName, file);
  }

  const endpoint =
    validFiles.length === 1
      ? `/admin/platform/restaurants/${clientId}/menu/extract-from-image`
      : `/admin/platform/restaurants/${clientId}/menu/extract-from-images`;

  const { data } = await adminClient.post(endpoint, formData, {
    timeout: 120000 * Math.max(validFiles.length, 1),
  });

  return data;
};

export const bulkImportRestaurantMenu = async (clientId, payload) => {
  const { data } = await adminClient.post(
    `/admin/platform/restaurants/${clientId}/menu/bulk-import`,
    payload,
    { timeout: 120000 }
  );

  return data;
};
