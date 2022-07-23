const queue = [];

const exec = () => {
  while (queue.length) {
    let { node, value } = queue.shift();
    node.seq.forEach((step) => (value = step(value)));
    node.next.forEach((node) => queue.push({ node, value }));
  }
};

export const launch = (unit, value) => {
  queue.push({ node: unit.graphite, value });
  exec();
};

export const createNode = ({ next = [], seq = [] } = {}) => ({
  next,
  seq,
});

export const createEvent = () => {
  const event = (payload) => launch(event, payload);
  event.graphite = createNode();
  event.watch = watch(event);

  return event;
};

export const watch = (unit) => (fn) => {
  const node = createNode({ seq: [fn] });

  unit.graphite.next.push(node);
};

export const createStore = (defaultState) => {
  let currentState = defaultState;
  const store = {};

  store.graphite = createNode({
    seq: [(value) => (currentState = value)],
  });

  store.watch = (fn) => {
    fn(currentState);
    return watch(store)(fn);
  };

  store.on = (event, fn) => {
    const node = createNode({
      next: [store.graphite],
      seq: [(value) => fn(currentState, value)],
    });
    event.graphite.next.push(node);
    return store;
  };

  store.reset = (event) => store.on(event, () => defaultState);

  return store;
};
