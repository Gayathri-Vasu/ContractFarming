const subscribers = new Map(); // userId -> Set(res)

function addSubscriber(userId, res) {
  const key = String(userId);
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(res);
}

function removeSubscriber(userId, res) {
  const key = String(userId);
  const set = subscribers.get(key);
  if (set) {
    set.delete(res);
    if (set.size === 0) subscribers.delete(key);
  }
}

function publish(userId, payload) {
  const key = String(userId);
  const set = subscribers.get(key);
  if (!set) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(data);
    } catch {}
  }
}

module.exports = { addSubscriber, removeSubscriber, publish };

