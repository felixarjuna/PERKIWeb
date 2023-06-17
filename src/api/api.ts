import axios from "axios";

export const getVOTD = async () => {
  const verse = await axios.get("https://beta.ourmanna.com/api/v1/get");
  return verse.data;
};
