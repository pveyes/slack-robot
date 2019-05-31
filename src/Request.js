/* eslint no-use-before-define: 0 */
export default class Request {
  constructor(msg, listener) {
    const message = {
      type: msg.type,
      value: msg.value,
      timestamp: msg.timestamp
    };
    const { from, to }= msg;
    let params = {};
    let matches = [];

    if (msg.to) {
      switch (to.id.charAt(0).toLowerCase()) {
        case "c":
          to.type = "channel";
          break;
        case "g":
          to.type = "group";
          break;
        case "d":
          to.type = "dm";
          break;
        /* istanbul ignore next: */
        default:
          to.type = "channel";
      }
    }

    if (message.type === "message") {
      params = getParams(message.value.text, listener.value, listener.matcher);

      // do not fill matches when params exist
      if (Object.keys(params).length === 0) {
        matches = getMatches(message.value.text, listener.matcher);
      }
    }

    this.message = message;
    this.from = from;
    this.to = to;
    this.params = params;
    this.matches = matches;
    this.listener = listener;

    Object.defineProperty(this, "user", {
      enumerable: false,
      writable: false,
      value: this.from
    });

    Object.defineProperty(this, "channel", {
      enumerable: false,
      writable: false,
      value: this.to
    });
  }
}

/**
 * @private
 * @param {string} text
 * @param {string|RegExp} value
 * @param {RegExp} matcher
 * @return {Object}
 */
function getParams(text, value, matcher) {
  const payload = {};

  if (value instanceof RegExp) {
    return payload;
  }

  let payloadList = value.match(/:[a-zA-Z]+/g);

  if (!payloadList) {
    return payload;
  }

  // remove leading ":" in named regex
  payloadList = payloadList.map(v => {
    return v.replace(/^:/, "");
  });

  for (let i = 0; i < payloadList.length; i += 1) {
    const regexIndex = `$${i + 1}`;
    const payloadName = payloadList[i];
    payload[payloadName] = text.replace(matcher, regexIndex);
  }

  return payload;
}

/**
 * @private
 * @param {string} text
 * @param {RegExp} matcher
 */
function getMatches(text, matcher) {
  const matches = text.match(matcher);

  // first regex match always return the message and we don't need it
  // we only care about other matches so we remove it from result
  matches.shift();

  return Array.prototype.slice.call(matches);
}
