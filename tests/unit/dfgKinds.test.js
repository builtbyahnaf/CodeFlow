import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  FLOW_NODE_KINDS,
  FLOW_EDGE_KINDS,
  FLOW_STATUSES,
  FLOW_REASON_CODES,
  flowEdgeLabel,
  glyphForFlowStatus,
} from '../../src/core/graph/dfg/kinds.js';

describe('dfg/kinds', () => {
  it('FLOW_NODE_KINDS is frozen and contains expected values', () => {
    assert.ok(Object.isFrozen(FLOW_NODE_KINDS));
    for (const k of ['def', 'use', 'defuse', 'param', 'return', 'kill']) {
      assert.ok(FLOW_NODE_KINDS.includes(k), `missing kind: ${k}`);
    }
  });

  it('FLOW_EDGE_KINDS is frozen and contains expected values', () => {
    assert.ok(Object.isFrozen(FLOW_EDGE_KINDS));
    for (const k of ['reaching', 'assign', 'param_to_arg', 'return_to_use', 'loop_carried', 'capture']) {
      assert.ok(FLOW_EDGE_KINDS.includes(k), `missing kind: ${k}`);
    }
  });

  it('FLOW_STATUSES is frozen', () => {
    assert.ok(Object.isFrozen(FLOW_STATUSES));
    assert.ok(FLOW_STATUSES.includes('resolved'));
    assert.ok(FLOW_STATUSES.includes('unresolved'));
    assert.ok(FLOW_STATUSES.includes('partial'));
  });

  it('FLOW_REASON_CODES is frozen and has at least 10 codes', () => {
    assert.ok(Object.isFrozen(FLOW_REASON_CODES));
    assert.ok(FLOW_REASON_CODES.length >= 10);
  });

  