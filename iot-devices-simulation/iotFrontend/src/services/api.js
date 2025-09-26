export async function fetchDevices() {
  try {
    const res = await fetch("http://localhost:5000/devices"); 
    return await res.json();
  } catch (err) {
    console.error("Error fetching devices:", err);
    return [];
  }
}
