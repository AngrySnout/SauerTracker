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
  return 'DE';
}
