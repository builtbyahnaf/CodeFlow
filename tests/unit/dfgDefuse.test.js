import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractSites,
  extractParamSites,
  extractConservativeKill,
  extractUnmodeledKills,
  extractCaptureSite,
} from '../../src/core/graph/dfg/defuse.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ordinalMap() { return new Map(); }

const BASE_PARAM = {
  id: 'x',
  name: 'x',
  kind: 'param',
  isMutable: true,
  isReference: false,
  isClosure: false,
};

// ---------------------------------------------------------------------------
// extractSites
// ---------------------------------------------------------------------------

describe('extractSites – assignment', () => {
  it('maps assign op to def kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'assign', status: 'resolved' }], ordinalMap());
    assert.equal(sites.length, 1);
    assert.equal(sites[0].kind, 'def');
    assert.equal(sites[0].status, 'resolved');
    assert.equal(sites[0].bindingId, 'x');
  });

  it('maps read op to use kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'read', status: 'resolved' }], ordinalMap());
    assert.equal(sites[0].kind, 'use');
  });

  it('maps read_write op to defuse kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'read_write', status: 'resolved' }], ordinalMap());
    assert.equal(sites[0].kind, 'defuse');
  });

  it('maps increment op to def kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'increment', status: 'resolved' }], ordinalMap());
    assert.equal(sites[0].kind, 'def');
  });

  it('maps compound_assign op to def kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'compound_assign', status: 'resolved' }], ordinalMap());
    assert.equal(sites[0].kind, 'def');
  });

  it('maps destruct_assign op to def kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'destruct_assign', status: 'resolved' }], ordinalMap());
    assert.equal(sites[0].kind, 'def');
  });

  it('maps param_entry op to param kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'param_entry', status: 'resolved' }], ordinalMap());
    assert.equal(sites[0].kind, 'param');
  });

  it('maps return_value op to return kind', () => {
    const sites = extractSites('n1', [{ bindingId: 'x', op: 'return_value', status: 'resolved' }], ordinalMap());
    assert.equal(sites[0].kind, 'return');
  });

  it('assigns ordinals deterministically', () => {
    const om = ordinalMap();
    const a = extractSites('n1', [{ bindingId: 'x', op: 'assign', status: 'resolved' }], om);
    const b = extractSites('n1', [{ bindingId: 'x', op: 'read', status: 'resolved' }], om);
    assert.ok(a[0].nodeId.endsWith('#0'));
    assert.ok(b[0].nodeId.endsWith('#1'));
  });

  it('skips facts without bindingId', () => {
    const sites = extractSites('n1', [{ op: 'assign', status: 'resolved' }], ordinalMap());
    assert.equal(sites.length, 0);
  });

  it('propagates reasonCode', () => {
    const sites = extractSites('n1', [{
      bindingId: 'x', op: 'read', status: 'possible', reasonCode: 'aliasing_unknown',
    }], ordinalMap());
    assert.equal(sites[0].reasonCode, 'aliasing_unknown');
  });
});

// ---------------------------------------------------------------------------
// extractParamSites
// ---------------------------------------------------------------------------

describe('extractParamSites', () => {
  it('creates param sites for each parameter', () => {
    const params = [
      { ...BASE_PARAM, id: 'a', name: 'a' },
      { ...BASE_PARAM, id: 'b', name: 'b' },
    ];
    const sites = extractParamSites('entry', params, ordinalMap());
    assert.equal(sites.length, 2);
    assert.ok(sites.every((s) => s.kind === 'param'));
    assert.ok(sites.every((s) => s.status === 'resolved'));
  });

  it('marks reference parameters as possible', () => {
    const params = [{ ...BASE_PARAM, id: 'ref', name: 'ref', isReference: true }];
    const sites = extractParamSites('entry', params, ordinalMap());
    assert.equal(sites[0].status, 'possible');
    assert.equal(sites[0].reasonCode, 'reference_parameter');
  });
});

// ---------------------------------------------------------------------------
// extractConservativeKill
// ---------------------------------------------------------------------------

describe('extractConservativeKill', () => {
  it('emits unresolved kill for unresolved call', () => {
    const site = extractConservativeKill('n1', BASE_PARAM, 'unresolved', ordinalMap());
    assert.equal(site.kind, 'kill');
    assert.equal(site.status, 'unresolved');
    assert.equal(site.reasonCode, 'unresolved_call');
  });

  it('emits possible kill for possible call', () => {
    const site = extractConservativeKill('n1', BASE_PARAM, 'possible', ordinalMap());
    assert.equal(site.status, 'possible');
  });
});

// ---------------------------------------------------------------------------
// extractUnmodeledKills
// ---------------------------------------------------------------------------

describe('extractUnmodeledKills', () => {
  it('kills all mutable bindings', () => {
    const bindings = [
      { ...BASE_PARAM, id: 'a', isMutable: true },
      { ...BASE_PARAM, id: 'b', isMutable: false },
    ];
    const sites = extractUnmodeledKills('n1', bindings, ordinalMap());
    assert.equal(sites.length, 1);
    assert.equal(sites[0].bindingId, 'a');
    assert.equal(sites[0].reasonCode, 'unmodeled_region');
  });
});

// ---------------------------------------------------------------------------
// extractCaptureSite
// ---------------------------------------------------------------------------

describe('extractCaptureSite', () => {
  it('emits a kill site for captured binding', () => {
    const site = extractCaptureSite('n1', BASE_PARAM, 'inner_fn', ordinalMap());
    assert.equal(site.kind, 'kill');
    assert.equal(site.status, 'inferred');
    assert.equal(site.reasonCode, 'capture_mutation');
  });
});
