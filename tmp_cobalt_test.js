async function testCobalt() {
  try {
    const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: "https://www.youtube.com/watch?v=R9Ihppczxok",
        isAudioOnly: true
      })
    });
    
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", json);
  } catch(e) {
    console.error(e);
  }
}
testCobalt();
