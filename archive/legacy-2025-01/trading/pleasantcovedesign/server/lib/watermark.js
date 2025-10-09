'use strict';

const { nanoid } = require('nanoid');

function wrapResponse(data, source = 'paper') {
  return {
    data,
    meta: {
      asOf: new Date().toISOString(),
      source,
      schema_version: 'v1',
      trace_id: nanoid(),
    },
  };
}

function errorResponse(reason, httpStatus = 503, extra = {}) {
  return {
    status: httpStatus,
    body: {
      error: true,
      reason,
      ...extra,
      meta: {
        asOf: new Date().toISOString(),
        source: 'paper',
        schema_version: 'v1',
        trace_id: nanoid(),
      },
    },
  };
}

module.exports = { wrapResponse, errorResponse };


