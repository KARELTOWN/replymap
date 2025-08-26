export const getIpAdress = async () => {
  try {
    let ipAdress = "";
    let localization = {};
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
      console.error("Error fetching IP");
    }
    const data = await response.json();
    ipAdress = data.ip;
    if (ipAdress) {
      const res = await fetch(`http://ip-api.com/json/${ipAdress}`);
      if (!res.ok) {
        console.error("Error fetching IP");
      }
      const data = await res.json();
      if (data.status == "success") {
        localization = {
          country: data.country,
          timezone: data.timezone,
          region: data.regionName,
          city: data.city,
        };
        return localization;
      }
      return {};
    }
  } catch (error) {
    console.error("Error fetching IP:", error);
  }
};
