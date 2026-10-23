import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { createMetaClient } from './metaLeadAdsApi';
import MappingModal from './MappingModal';
import {
  adsQuery,
  applyFormCatalog,
  discoveryLabel,
  emptySelection,
  fieldError,
  filterMappingRows,
  formatWhen,
  isCrmAdmin,
  mappingPayload,
  mergeMappingRows,
  nextSelection,
  readSessionUser,
  selectionFromMapping,
} from './metaLeadAdsState';

function sessionMessage(result) {
  if (result && (result.status === 401 || result.status === 403)) {
    return result.status === 403
      ? 'CRM admin permission is required.'
      : 'Your admin session is missing or has expired.';
  }
  return '';
}

function resultMessage(result, fallback) {
  const session = sessionMessage(result);
  if (session) return session;
  if (result && result.body && result.body.message) return result.body.message;
  return fallback;
}

export default function MetaLeadAds({ client: clientProp } = {}) {
  const user = readSessionUser();
  const admin = isCrmAdmin(user);
  const client = useMemo(() => clientProp || createMetaClient({
    baseUrl: process.env.REACT_APP_MIPIE_BACKEND_URL,
    token: user.token,
  }), [clientProp, user.token]);

  const [tab, setTab] = useState('ads');
  const [notice, setNotice] = useState(null);
  const [config, setConfig] = useState(null);
  const [connection, setConnection] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [adsFilter, setAdsFilter] = useState('active');
  const [adsPage, setAdsPage] = useState(1);
  const [ads, setAds] = useState([]);
  const [adsTotal, setAdsTotal] = useState(0);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState('');
  const [rows, setRows] = useState([]);
  const [mappingFilter, setMappingFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState('');
  const [unresolvedTotal, setUnresolvedTotal] = useState(0);
  const [modal, setModal] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const showNotice = useCallback((message, type) => {
    setNotice({ message, type });
    if (type === 'success') toast.success(message);
    if (type === 'danger') toast.error(message);
  }, []);

  const loadOverview = useCallback(async () => {
    const [configResult, statusResult] = await Promise.all([
      client.configStatus(),
      client.syncStatus(),
    ]);
    if (configResult.ok) setConfig(configResult.body);
    else setConfig({ configurationComplete: false, missing: [], message: resultMessage(configResult, 'Meta configuration could not be loaded.') });
    if (statusResult.ok) setSyncStatus(statusResult.body);
  }, [client]);

  const loadAds = useCallback(async () => {
    setAdsLoading(true);
    setAdsError('');
    const params = Object.fromEntries(new URLSearchParams(adsQuery(adsFilter, adsPage)));
    const result = await client.ads(params);
    setAdsLoading(false);
    if (!result.ok || !result.body || result.body.success === false) {
      setAds([]);
      setAdsError(resultMessage(result, 'Discovered ads could not be loaded.'));
      return;
    }
    setAds(result.body.ads || []);
    setAdsTotal(result.body.total || 0);
  }, [adsFilter, adsPage, client]);

  const loadMappings = useCallback(async () => {
    setMappingLoading(true);
    setMappingError('');
    const mappingParams = { limit: 100, page: 1 };
    if (mappingFilter === 'Mapped') mappingParams.isActive = 'true';
    if (mappingFilter === 'Inactive') mappingParams.isActive = 'false';
    const requests = [
      client.forms(),
      client.ads({ discoveryStatus: 'form_unresolved', limit: 1, page: 1 }),
    ];
    if (mappingFilter === 'Unmapped') requests.push(client.unmapped({ limit: 100, page: 1 }));
    else if (mappingFilter === 'All') {
      requests.push(client.mappings(mappingParams), client.unmapped({ limit: 100, page: 1 }));
    } else requests.push(client.mappings(mappingParams));
    const results = await Promise.all(requests);
    const failed = results.find(result => !result.ok);
    setMappingLoading(false);
    if (failed) {
      setRows([]);
      setMappingError(resultMessage(failed, 'Form mappings could not be loaded.'));
      return;
    }
    const forms = (results[0].body && results[0].body.forms) || [];
    const unresolved = results[1].body && results[1].body.total;
    setUnresolvedTotal(unresolved || 0);
    const mappings = mappingFilter === 'Unmapped' ? [] : ((results[2].body && results[2].body.mappings) || []);
    const unmappedResult = mappingFilter === 'All' ? results[3] : results[2];
    const unmapped = mappingFilter === 'Mapped' || mappingFilter === 'Inactive'
      ? []
      : ((unmappedResult.body && unmappedResult.body.forms) || []);
    const openForms = mappingFilter === 'Unmapped'
      ? unmapped.filter(form => !form.inactiveMapping)
      : unmapped;
    setRows(applyFormCatalog(mergeMappingRows(mappings, openForms), forms));
  }, [client, mappingFilter]);

  useEffect(() => {
    if (admin) loadOverview();
  }, [admin, loadOverview]);

  useEffect(() => {
    if (admin && tab === 'ads') loadAds();
  }, [admin, tab, loadAds]);

  useEffect(() => {
    if (admin && tab === 'mapping') loadMappings();
  }, [admin, tab, loadMappings]);

  useEffect(() => {
    if (admin && tab === 'status') {
      client.connectionStatus().then((result) => {
        if (result.ok) setConnection(result.body);
      });
    }
  }, [admin, tab, client]);

  async function syncAds() {
    if (syncing) return;
    setSyncing(true);
    setNotice(null);
    const result = await client.syncAds({});
    setSyncing(false);
    if (result.status === 409) {
      showNotice(resultMessage(result, 'A Meta ad sync is already running.'), 'danger');
      return;
    }
    if (!result.ok || !result.body || result.body.success === false) {
      const missing = result.body && result.body.missing && result.body.missing.length
        ? ` Missing: ${result.body.missing.join(', ')}.`
        : '';
      showNotice(`${resultMessage(result, 'Meta ads could not be synchronized.')}${missing}`, 'danger');
      return;
    }
    const body = result.body;
    showNotice(
      `Sync ${body.result}. Ads ${body.adsFetched || 0}, forms ${body.leadFormsDiscovered || 0}, unresolved ${body.unresolvedForms || 0}.`,
      'success',
    );
    await Promise.all([loadOverview(), loadAds()]);
  }

  async function testConnection() {
    setTesting(true);
    const [adAccount, page, permissions] = await Promise.all([
      client.testAdAccount(),
      client.testPage(),
      client.testPermissions(),
    ]);
    const status = await client.connectionStatus();
    setTesting(false);
    if (status.ok) setConnection(status.body);
    const failed = [adAccount, page, permissions].find(result => !result.ok);
    if (failed) showNotice(resultMessage(failed, 'The connection test failed.'), 'danger');
    else showNotice('Connection test finished. Review the status below.', 'success');
  }

  async function openCreate(row) {
    const projectsResult = await client.projects();
    const optionsResult = await client.options();
    setModal({
      selection: emptySelection(row),
      projects: projectsResult.ok && projectsResult.body ? projectsResult.body.data || [] : [],
      options: optionsResult.ok && optionsResult.body ? optionsResult.body : { leadSources: [], courses: [], statuses: [] },
      loadingOptions: false,
      saving: false,
      fieldErrors: {},
    });
  }

  async function openEdit(row) {
    const result = await client.mapping(row.mappingId);
    if (!result.ok || !result.body || !result.body.mapping) {
      showNotice(resultMessage(result, 'The mapping could not be loaded.'), 'danger');
      return;
    }
    const selection = selectionFromMapping(result.body.mapping);
    const [projectsResult, optionsResult] = await Promise.all([
      client.projects(),
      client.options(selection.projectId),
    ]);
    setModal({
      selection,
      projects: projectsResult.ok && projectsResult.body ? projectsResult.body.data || [] : [],
      options: optionsResult.ok && optionsResult.body ? optionsResult.body : { leadSources: [], courses: [], statuses: [] },
      loadingOptions: false,
      saving: false,
      fieldErrors: {},
    });
  }

  async function changeSelection(patch) {
    const selection = nextSelection(modal.selection, patch);
    const projectChanged = Object.prototype.hasOwnProperty.call(patch, 'projectId')
      && patch.projectId !== modal.selection.projectId;
    setModal({ ...modal, selection, fieldErrors: {}, loadingOptions: projectChanged });
    if (!projectChanged) return;
    if (!patch.projectId) {
      const optionsResult = await client.options();
      setModal(current => ({
        ...current,
        selection,
        loadingOptions: false,
        options: optionsResult.body || { leadSources: [], courses: [], statuses: [] },
      }));
      return;
    }
    const optionsResult = await client.options(patch.projectId);
    setModal(current => ({
      ...current,
      selection,
      loadingOptions: false,
      options: optionsResult.ok && optionsResult.body
        ? optionsResult.body
        : { leadSources: [], courses: [], statuses: [] },
      fieldErrors: optionsResult.ok ? {} : { projectId: resultMessage(optionsResult, 'Project options could not be loaded.') },
    }));
  }

  async function saveMapping() {
    const { selection } = modal;
    setModal({ ...modal, saving: true, fieldErrors: {} });
    const payload = mappingPayload(selection);
    const result = selection.mappingId
      ? await client.updateMapping(selection.mappingId, { ...payload, isActive: true })
      : await client.createMapping(payload);
    if (!result.ok || !result.body || result.body.success === false) {
      const key = fieldError(result.body && result.body.code);
      const message = resultMessage(result, 'The mapping was not saved.');
      setModal(current => ({
        ...current,
        saving: false,
        fieldErrors: key ? { [key]: message } : { form: message },
      }));
      return;
    }
    setModal(null);
    showNotice(selection.mappingId && selection.isActive === false ? 'Mapping reactivated.' : 'Mapping saved.', 'success');
    setTab('mapping');
    await loadMappings();
  }

  async function confirmDeactivate() {
    const target = deactivateTarget;
    setDeactivateTarget(null);
    const result = await client.deactivateMapping(target.mappingId);
    if (!result.ok || !result.body || result.body.success === false) {
      showNotice(resultMessage(result, 'The mapping was not deactivated.'), 'danger');
      return;
    }
    showNotice('Mapping deactivated.', 'success');
    await loadMappings();
  }

  async function reactivate(row) {
    const result = await client.updateMapping(row.mappingId, { isActive: true });
    if (!result.ok || !result.body || result.body.success === false) {
      showNotice(resultMessage(result, 'The mapping was not reactivated.'), 'danger');
      return;
    }
    showNotice('Mapping reactivated.', 'success');
    await loadMappings();
  }

  if (!admin) {
    return (
      <div className="alert alert-warning" role="alert">
        CRM admin permission is required to open Meta Lead Ads.
      </div>
    );
  }

  const missing = (config && config.missing) || [];
  const credentialsMissing = config && config.configurationComplete === false;
  const visibleRows = filterMappingRows(rows, { status: mappingFilter, search });
  const adPages = Math.max(Math.ceil(adsTotal / 20), 1);

  return (
    <div className="content-body">
      <ToastContainer position="top-right" autoClose={4000} />
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Meta Lead Ads</h4>
          {tab === 'ads' && (
            <button type="button" className="btn btn-primary" disabled={syncing} onClick={syncAds}>
              {syncing ? 'Syncing Meta ads…' : 'Sync Meta Ads'}
            </button>
          )}
        </div>
        <div className="card-body">
          {credentialsMissing && (
            <div className="alert alert-warning" role="alert">
              Meta credentials are not configured. Add the missing server settings before synchronizing.
              {missing.length ? ` Missing: ${missing.join(', ')}.` : ''}
              Access tokens are not shown here.
            </div>
          )}
          {notice && <div className={`alert alert-${notice.type}`} role="status">{notice.message}</div>}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button type="button" className={`nav-link ${tab === 'ads' ? 'active' : ''}`} onClick={() => setTab('ads')}>Discovered Ads</button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${tab === 'mapping' ? 'active' : ''}`} onClick={() => setTab('mapping')}>Form Mapping</button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')}>Integration Status</button>
            </li>
          </ul>

          {tab === 'ads' && (
            <div>
              <div className="d-flex gap-2 mb-3">
                <button type="button" className={`btn btn-sm ${adsFilter === 'active' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => { setAdsFilter('active'); setAdsPage(1); }}>Active Ads</button>
                <button type="button" className={`btn btn-sm ${adsFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => { setAdsFilter('all'); setAdsPage(1); }}>All Ads</button>
                <button type="button" className={`btn btn-sm ${adsFilter === 'unresolved' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => { setAdsFilter('unresolved'); setAdsPage(1); }}>Unresolved forms</button>
              </div>
              {syncStatus && (
                <p className="text-muted">
                  Last synchronization: {syncStatus.status === 'not_synced' ? 'Not synced yet' : formatWhen(syncStatus.lastSyncedAt)}
                  {syncStatus.stats ? ` · Ads ${syncStatus.stats.adsFetched || 0}, forms ${syncStatus.stats.leadFormsDiscovered || 0}, unresolved ${syncStatus.stats.unresolvedForms || 0}` : ''}
                </p>
              )}
              {syncStatus && syncStatus.errors && syncStatus.errors.length > 0 && (
                <div className="alert alert-danger">
                  {syncStatus.errors.map(error => error.message).filter(Boolean).join(' ')}
                </div>
              )}
              {adsLoading && <div className="spinner-border" role="status"><span className="visually-hidden">Loading</span></div>}
              {adsError && <div className="alert alert-danger">{adsError}</div>}
              {!adsLoading && !adsError && ads.length === 0 && (
                <div className="alert alert-light">No advertisements have been discovered yet.</div>
              )}
              {ads.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Ad Name</th>
                        <th>Ad ID</th>
                        <th>Campaign ID</th>
                        <th>Facebook Page ID</th>
                        <th>Facebook Form ID</th>
                        <th>Form Name</th>
                        <th>Effective Ad Status</th>
                        <th>Form Discovery Status</th>
                        <th>Last Synced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ads.map(ad => (
                        <tr key={ad.adId}>
                          <td>{ad.adName || '—'}</td>
                          <td>{ad.adId}</td>
                          <td>{ad.campaignId || '—'}</td>
                          <td>{ad.pageId || '—'}</td>
                          <td>{ad.formId || '—'}</td>
                          <td>
                            {ad.formName || '—'}
                            {ad.formMetadataStatus === 'unavailable' && (
                              <div className="text-warning">Form details unavailable</div>
                            )}
                            {ad.discoveryStatus === 'form_unresolved' && (
                              <div className="text-warning">This ad cannot be mapped until a single lead form is discovered.</div>
                            )}
                          </td>
                          <td>{ad.effectiveStatus || '—'}</td>
                          <td>{discoveryLabel(ad.discoveryStatus)}</td>
                          <td>{formatWhen(ad.lastSyncedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={adsPage <= 1} onClick={() => setAdsPage(adsPage - 1)}>Previous</button>
                <span className="align-self-center">Page {adsPage} of {adPages}</span>
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={adsPage >= adPages} onClick={() => setAdsPage(adsPage + 1)}>Next</button>
              </div>
            </div>
          )}

          {tab === 'mapping' && (
            <div>
              {unresolvedTotal > 0 && (
                <div className="alert alert-warning">
                  {unresolvedTotal} advertisement{unresolvedTotal === 1 ? '' : 's'} have an unresolved lead form. Those ads are not listed for mapping.
                </div>
              )}
              <div className="row g-2 mb-3">
                <div className="col-md-4">
                  <input className="form-control" placeholder="Search forms" value={search} onChange={event => setSearch(event.target.value)} aria-label="Search forms" />
                </div>
                <div className="col-md-3">
                  <select className="form-select" aria-label="Mapping status" value={mappingFilter} onChange={event => setMappingFilter(event.target.value)}>
                    <option>All</option>
                    <option>Mapped</option>
                    <option>Unmapped</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              {mappingLoading && <div className="spinner-border" role="status"><span className="visually-hidden">Loading</span></div>}
              {mappingError && <div className="alert alert-danger">{mappingError}</div>}
              {!mappingLoading && !mappingError && visibleRows.length === 0 && (
                <div className="alert alert-light">No lead forms are available to map.</div>
              )}
              {visibleRows.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Facebook Page ID</th>
                        <th>Facebook Form Name</th>
                        <th>Form ID</th>
                        <th>Project</th>
                        <th>Course</th>
                        <th>Lead Source</th>
                        <th>Default Status</th>
                        <th>Default Substatus</th>
                        <th>Mapping Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map(row => (
                        <tr key={`${row.pageId}-${row.formId}`}>
                          <td>{row.pageId}</td>
                          <td>
                            {row.formName || '—'}
                            {row.metadataStatus === 'unavailable' && <div className="text-warning">Form details unavailable</div>}
                            {row.projectId && !row.projectName && <div className="text-warning">Project no longer available</div>}
                            {row.courseId && !row.courseName && <div className="text-warning">Course no longer available</div>}
                          </td>
                          <td>{row.formId}</td>
                          <td>{row.projectName || '—'}</td>
                          <td>{row.courseName || '—'}</td>
                          <td>{row.leadSource || '—'}</td>
                          <td>{row.defaultStatus || '—'}</td>
                          <td>{row.defaultSubstatus || '—'}</td>
                          <td>{row.statusLabel}</td>
                          <td className="d-flex gap-1">
                            {row.statusLabel === 'Unmapped' && (
                              <button type="button" className="btn btn-sm btn-primary" onClick={() => openCreate(row)}>Map Form</button>
                            )}
                            {row.statusLabel === 'Mapped' && (
                              <>
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(row)}>Edit Mapping</button>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeactivateTarget(row)}>Deactivate Mapping</button>
                              </>
                            )}
                            {row.statusLabel === 'Inactive' && row.mappingId && (
                              <>
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(row)}>Edit Mapping</button>
                                <button type="button" className="btn btn-sm btn-outline-success" onClick={() => reactivate(row)}>Reactivate Mapping</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'status' && (
            <div>
              <button type="button" className="btn btn-primary mb-3" disabled={testing} onClick={testConnection}>
                {testing ? 'Testing connection…' : 'Test Connection'}
              </button>
              <div className="row g-3">
                <StatusCard title="Ad Account" item={connection && connection.adAccount} configured={config && config.configured && config.configured.adAccountId} />
                <StatusCard title="Facebook Page" item={connection && connection.page} configured={config && config.configured && config.configured.pageId} />
                <div className="col-md-4">
                  <div className="border rounded p-3 h-100">
                    <h6>Permissions</h6>
                    <p className="mb-1">Availability: {(connection && connection.permissions && connection.permissions.status) || 'not tested'}</p>
                    <p className="mb-0 text-muted">Permission checks run only when you choose Test Connection.</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded p-3 h-100">
                    <h6>Latest synchronization</h6>
                    <p className="mb-1">State: {(syncStatus && syncStatus.status) || 'not loaded'}</p>
                    <p className="mb-0">Last run: {formatWhen(syncStatus && syncStatus.lastSyncedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <MappingModal
          selection={modal.selection}
          projects={modal.projects}
          options={modal.options}
          loadingOptions={modal.loadingOptions}
          saving={modal.saving}
          fieldErrors={modal.fieldErrors}
          onChange={changeSelection}
          onClose={() => setModal(null)}
          onSave={saveMapping}
        />
      )}

      {deactivateTarget && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.45)' }} role="dialog" aria-label="Deactivate mapping">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <p>Deactivate this mapping? The record is kept and can be reactivated.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setDeactivateTarget(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDeactivate}>Confirm deactivation</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({ title, item, configured }) {
  const credentials = item ? item.credentials : (configured ? 'configured' : 'not configured');
  const status = item ? item.status : 'not tested';
  return (
    <div className="col-md-4">
      <div className="border rounded p-3 h-100">
        <h6>{title}</h6>
        <p className="mb-1">Configuration: {credentials}</p>
        <p className="mb-1">Connection: {status}</p>
        {item && item.message && <p className="mb-0 text-muted">{item.message}</p>}
      </div>
    </div>
  );
}
