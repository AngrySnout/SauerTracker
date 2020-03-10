import ip2loc from 'ip2location-nodejs';
import countries from 'i18n-iso-countries';

ip2loc.IP2Location_init('./IP2LOCATION-LITE-DB1.BIN');

export function formatIP(ipInt) {
  return (
    (ipInt >>> 24) +
    '.' +
    ((ipInt >> 16) & 255) +
    '.' +
    ((ipInt >> 8) & 255) +
    '.' +
    (ipInt & 255)
  );
}

export default function getCountry(ip) {
  if (ip === '2.16.6.0') return 'DE';
  
  const country = ip2loc.IP2Location_get_country_short(ip);
  if (country === '?' || country === '-') return '';
  return country;
}

export function getCountryName(countryCode) {
  if (countryCode === 'US') {
    return 'United States'; // Instead of United States of America
  }
  return countries.getName(countryCode, 'en');
}
