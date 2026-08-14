import axios from "axios";
import { RESTAURANT_API_BASE_URL } from "./baseUrl";

export async function getWhatsAppSupportConfig() {
  const { data } = await axios.get(`${RESTAURANT_API_BASE_URL}/user/support/whatsapp`);
  return data;
}
