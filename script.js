/* =========================================================================
   六轉核心進度計算器 — script.js
   命名原則：變數與函式使用完整語意名稱，避免縮寫或無意義命名。
   ========================================================================= */

const LOCAL_STORAGE_KEY = 'hexa-core-tracker-v2';
const MAX_CORE_LEVEL = 30;
const HEX_QUADRANT_CAPACITY = 4; // 每個象限固定保留 4 格，多出的格子在資料未定義時顯示為「鎖定」

/* -------------------------------------------------------------------------
   核心消耗資料表：每種節點類型從 0 級升到 30 級，每一級所需的 Sol Erda / Fragment
   ------------------------------------------------------------------------- */
const CORE_COST_TABLES = {
  "skill node": [
    { erda: 5, frag: 100 }, { erda: 1, frag: 30 }, { erda: 1, frag: 35 },
    { erda: 1, frag: 40 }, { erda: 2, frag: 45 }, { erda: 2, frag: 50 },
    { erda: 2, frag: 55 }, { erda: 3, frag: 60 }, { erda: 3, frag: 65 },
    { erda: 10, frag: 200 }, { erda: 3, frag: 80 }, { erda: 3, frag: 90 },
    { erda: 4, frag: 100 }, { erda: 4, frag: 110 }, { erda: 4, frag: 120 },
    { erda: 4, frag: 130 }, { erda: 4, frag: 140 }, { erda: 4, frag: 150 },
    { erda: 5, frag: 160 }, { erda: 15, frag: 350 }, { erda: 5, frag: 170 },
    { erda: 5, frag: 180 }, { erda: 5, frag: 190 }, { erda: 5, frag: 200 },
    { erda: 5, frag: 210 }, { erda: 6, frag: 220 }, { erda: 6, frag: 230 },
    { erda: 6, frag: 240 }, { erda: 7, frag: 250 }, { erda: 20, frag: 500 }
  ],
  "mastery node": [
    { erda: 3, frag: 50 }, { erda: 1, frag: 15 }, { erda: 1, frag: 18 },
    { erda: 1, frag: 20 }, { erda: 1, frag: 23 }, { erda: 1, frag: 25 },
    { erda: 1, frag: 28 }, { erda: 2, frag: 30 }, { erda: 2, frag: 33 },
    { erda: 5, frag: 100 }, { erda: 2, frag: 40 }, { erda: 2, frag: 45 },
    { erda: 2, frag: 50 }, { erda: 2, frag: 55 }, { erda: 2, frag: 60 },
    { erda: 2, frag: 65 }, { erda: 2, frag: 70 }, { erda: 2, frag: 75 },
    { erda: 3, frag: 80 }, { erda: 8, frag: 175 }, { erda: 3, frag: 85 },
    { erda: 3, frag: 90 }, { erda: 3, frag: 95 }, { erda: 3, frag: 100 },
    { erda: 3, frag: 105 }, { erda: 3, frag: 110 }, { erda: 3, frag: 115 },
    { erda: 3, frag: 120 }, { erda: 4, frag: 125 }, { erda: 10, frag: 250 }
  ],
  "boost node": [
    { erda: 4, frag: 75 }, { erda: 1, frag: 23 }, { erda: 1, frag: 27 },
    { erda: 1, frag: 30 }, { erda: 2, frag: 34 }, { erda: 2, frag: 38 },
    { erda: 2, frag: 42 }, { erda: 3, frag: 45 }, { erda: 3, frag: 49 },
    { erda: 8, frag: 150 }, { erda: 3, frag: 60 }, { erda: 3, frag: 68 },
    { erda: 3, frag: 75 }, { erda: 3, frag: 83 }, { erda: 3, frag: 90 },
    { erda: 3, frag: 98 }, { erda: 3, frag: 105 }, { erda: 3, frag: 113 },
    { erda: 4, frag: 120 }, { erda: 12, frag: 263 }, { erda: 4, frag: 128 },
    { erda: 4, frag: 135 }, { erda: 4, frag: 143 }, { erda: 4, frag: 150 },
    { erda: 4, frag: 158 }, { erda: 5, frag: 165 }, { erda: 5, frag: 173 },
    { erda: 5, frag: 180 }, { erda: 6, frag: 188 }, { erda: 15, frag: 375 }
  ],
  "common node": [
    { erda: 7, frag: 125 }, { erda: 2, frag: 38 }, { erda: 2, frag: 44 },
    { erda: 2, frag: 50 }, { erda: 3, frag: 57 }, { erda: 3, frag: 63 },
    { erda: 3, frag: 69 }, { erda: 5, frag: 75 }, { erda: 5, frag: 82 },
    { erda: 14, frag: 300 }, { erda: 5, frag: 110 }, { erda: 5, frag: 124 },
    { erda: 6, frag: 138 }, { erda: 6, frag: 152 }, { erda: 6, frag: 165 },
    { erda: 6, frag: 179 }, { erda: 6, frag: 193 }, { erda: 6, frag: 207 },
    { erda: 7, frag: 220 }, { erda: 17, frag: 525 }, { erda: 7, frag: 234 },
    { erda: 7, frag: 248 }, { erda: 7, frag: 262 }, { erda: 7, frag: 275 },
    { erda: 7, frag: 289 }, { erda: 9, frag: 303 }, { erda: 9, frag: 317 },
    { erda: 9, frag: 330 }, { erda: 10, frag: 344 }, { erda: 20, frag: 750 }
  ]
};

/* -------------------------------------------------------------------------
   目前已開放的核心。要新增核心時，只需要在這裡加一筆資料
   （quadrant + slotIndex 決定它出現在星盤的哪一格），不需要更動任何 CSS
   或座標計算——多出來的 slotIndex 沒有對應資料時，畫面會自動顯示鎖定格。
   ------------------------------------------------------------------------- */
const CORE_DEFINITIONS = [
  { id: 'skill1',   name: 'Skill 1',   type: 'skill node',   quadrant: 'tl', slotIndex: 0 },
  { id: 'skill2',   name: 'Skill 2',   type: 'skill node',   quadrant: 'tl', slotIndex: 1 },
  { id: 'mastery1', name: 'Mastery 1', type: 'mastery node', quadrant: 'tr', slotIndex: 0 },
  { id: 'mastery2', name: 'Mastery 2', type: 'mastery node', quadrant: 'tr', slotIndex: 1 },
  { id: 'mastery3', name: 'Mastery 3', type: 'mastery node', quadrant: 'tr', slotIndex: 2 },
  { id: 'mastery4', name: 'Mastery 4', type: 'mastery node', quadrant: 'tr', slotIndex: 3 },
  { id: 'boost1',   name: 'Boost 1',   type: 'boost node',   quadrant: 'bl', slotIndex: 0 },
  { id: 'boost2',   name: 'Boost 2',   type: 'boost node',   quadrant: 'bl', slotIndex: 1 },
  { id: 'boost3',   name: 'Boost 3',   type: 'boost node',   quadrant: 'bl', slotIndex: 2 },
  { id: 'boost4',   name: 'Boost 4',   type: 'boost node',   quadrant: 'bl', slotIndex: 3 },
  { id: 'common1',  name: 'Common 1',  type: 'common node',  quadrant: 'br', slotIndex: 0 },
  { id: 'common2',  name: 'Common 2',  type: 'common node',  quadrant: 'br', slotIndex: 1 },
];

// 底部「畢業進度（不含 Janus）」卡片要排除的核心 id（Janus 是 common1 的別名）
const JANUS_CORE_ID = 'common1';

const QUADRANT_STYLE_CLASS = { tl: 'skill', tr: 'mastery', bl: 'boost', br: 'common' };

/* -------------------------------------------------------------------------
   六角星盤幾何（尖頂六角形，尖角在正上/正下）
   只定義「右上（mastery）方向」的一套標準路徑，其餘三個象限都是它的鏡射，
   之後要延伸更多格子，只需要在 CANONICAL_STEP_SEQUENCE 多加一個方向，
   四個象限會自動同步展開，不必手動調整每個象限的座標。
   ------------------------------------------------------------------------- */
const HEXAGON_UNIT_SIZE = 7;
const DIRECTION_NORTHEAST = { x: (Math.sqrt(3) / 2) * HEXAGON_UNIT_SIZE, y: -1.5 * HEXAGON_UNIT_SIZE };
const DIRECTION_EAST = { x: Math.sqrt(3) * HEXAGON_UNIT_SIZE, y: 0 };
const CANONICAL_STEP_SEQUENCE = [DIRECTION_NORTHEAST, DIRECTION_NORTHEAST, DIRECTION_EAST, DIRECTION_NORTHEAST];

function calculateCumulativePositions(stepSequence) {
  let currentPosition = { x: 0, y: 0 };
  return stepSequence.map(step => {
    currentPosition = { x: currentPosition.x + step.x, y: currentPosition.y + step.y };
    return { ...currentPosition };
  });
}

const canonicalTopRightPositions = calculateCumulativePositions(CANONICAL_STEP_SEQUENCE);

// tl = 對垂直軸鏡射（x 取負）；br = 對水平軸鏡射（y 取負）；bl = 兩者都取負（中心點對稱）
const QUADRANT_NODE_POSITIONS = {
  tr: canonicalTopRightPositions,
  tl: canonicalTopRightPositions.map(p => ({ x: -p.x, y: p.y })),
  br: canonicalTopRightPositions.map(p => ({ x: p.x, y: -p.y })),
  bl: canonicalTopRightPositions.map(p => ({ x: -p.x, y: -p.y })),
};

/* -------------------------------------------------------------------------
   應用程式狀態
   ------------------------------------------------------------------------- */
let coreLevelsById = {};
let selectedCoreId = null;
let autoSaveTimerId = null;

const hexPlateElement = document.getElementById('hexaPlateElement');
const maxCostByNodeType = {};
Object.keys(CORE_COST_TABLES).forEach(nodeType => {
  maxCostByNodeType[nodeType] = calculateCumulativeCost(nodeType, MAX_CORE_LEVEL);
});

/* -------------------------------------------------------------------------
   共用計算函式
   ------------------------------------------------------------------------- */
function clampCoreLevel(rawValue) {
  return Math.max(0, Math.min(MAX_CORE_LEVEL, rawValue));
}

function formatNumberWithLocale(numericValue) {
  return Math.max(0, Math.round(numericValue)).toLocaleString('zh-Hant-TW');
}

function calculateCumulativeCost(nodeType, currentLevel) {
  const levelCostRows = CORE_COST_TABLES[nodeType];
  const clampedLevel = clampCoreLevel(currentLevel);
  let totalErda = 0;
  let totalFragments = 0;
  for (let i = 0; i < clampedLevel; i++) {
    totalErda += levelCostRows[i].erda;
    totalFragments += levelCostRows[i].frag;
  }
  return { erda: totalErda, frag: totalFragments };
}

// 通用合計計算：excludedCoreId 傳入要排除的核心 id（例如 JANUS_CORE_ID），傳 null 代表全部核心都算
function calculateGraduationTotals(excludedCoreId) {
  let totalErdaUsed = 0;
  let totalFragmentsUsed = 0;
  let totalErdaRequired = 0;
  let totalFragmentsRequired = 0;

  CORE_DEFINITIONS.forEach(coreDefinition => {
    if (coreDefinition.id === excludedCoreId) return;
    const usedCost = calculateCumulativeCost(coreDefinition.type, coreLevelsById[coreDefinition.id]);
    const maxCost = maxCostByNodeType[coreDefinition.type];
    totalErdaUsed += usedCost.erda;
    totalFragmentsUsed += usedCost.frag;
    totalErdaRequired += maxCost.erda;
    totalFragmentsRequired += maxCost.frag;
  });

  const totalRequired = totalErdaRequired + totalFragmentsRequired;
  const overallPercent = totalRequired > 0
    ? ((totalErdaUsed + totalFragmentsUsed) / totalRequired) * 100
    : 100;

  return { totalErdaUsed, totalFragmentsUsed, totalErdaRequired, totalFragmentsRequired, overallPercent };
}

/* -------------------------------------------------------------------------
   進度條區塊渲染（使用 Bootstrap 的 .progress 元件，顏色用客製 class 覆蓋）
   ------------------------------------------------------------------------- */
function buildProgressRowMarkup(labelText, progressBarColorClass, usedAmountText, percentValue) {
  const clampedPercent = Math.min(100, Math.max(0, percentValue));
  return `
    <div class="progress-row mb-3">
      <div class="d-flex justify-content-between small mb-1">
        <span class="text-muted">${labelText}</span>
        <span class="fw-semibold">${usedAmountText}</span>
      </div>
      <div class="progress" role="progressbar" aria-valuenow="${clampedPercent.toFixed(1)}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar ${progressBarColorClass}" style="width:${clampedPercent}%"></div>
      </div>
      <div class="text-end small text-muted mt-1">${clampedPercent.toFixed(1)}%</div>
    </div>`;
}

function renderProgressSection(containerElementId, totals) {
  const erdaPercent = totals.totalErdaRequired > 0 ? (totals.totalErdaUsed / totals.totalErdaRequired) * 100 : 100;
  const fragmentPercent = totals.totalFragmentsRequired > 0 ? (totals.totalFragmentsUsed / totals.totalFragmentsRequired) * 100 : 100;

  document.getElementById(containerElementId).innerHTML =
    buildProgressRowMarkup('Sol Erda', 'progress-bar-gold', `${formatNumberWithLocale(totals.totalErdaUsed)} / ${formatNumberWithLocale(totals.totalErdaRequired)}`, erdaPercent) +
    buildProgressRowMarkup('Sol Erda Fragment', 'progress-bar-violet', `${formatNumberWithLocale(totals.totalFragmentsUsed)} / ${formatNumberWithLocale(totals.totalFragmentsRequired)}`, fragmentPercent) +
    buildProgressRowMarkup('總進度', 'progress-bar-teal', `${totals.overallPercent.toFixed(1)}%`, totals.overallPercent);
}

function refreshAllProgressSections() {
  const overallTotals = calculateGraduationTotals(null);
  renderProgressSection('overallProgressContainer', overallTotals);
  renderProgressSection('excludingJanusProgressContainer', calculateGraduationTotals(JANUS_CORE_ID));
  updateHubProgressRing(overallTotals.overallPercent);
}

// 中心六角形進度環：用 conic-gradient 依「總進度」百分比即時填色，是資料驅動的視覺，不是純裝飾
function updateHubProgressRing(overallPercent) {
  const hubRingElement = document.getElementById('hexHubRing');
  if (!hubRingElement) return;
  const clampedPercent = Math.min(100, Math.max(0, overallPercent));
  hubRingElement.style.setProperty('--hub-progress', `${clampedPercent}%`);
}

/* -------------------------------------------------------------------------
   六角星盤渲染（含鎖定格）
   ------------------------------------------------------------------------- */
function renderHexagonPlate() {
  hexPlateElement.querySelectorAll('.hex-tile').forEach(tileElement => tileElement.remove());

  Object.keys(QUADRANT_NODE_POSITIONS).forEach(quadrant => {
    const positions = QUADRANT_NODE_POSITIONS[quadrant];
    for (let slotIndex = 0; slotIndex < HEX_QUADRANT_CAPACITY; slotIndex++) {
      const position = positions[slotIndex];
      const coreDefinition = CORE_DEFINITIONS.find(c => c.quadrant === quadrant && c.slotIndex === slotIndex);
      const leftPercent = 50 + position.x;
      const topPercent = 50 + position.y;

      if (coreDefinition) {
        hexPlateElement.appendChild(
          createActiveHexTileElement(coreDefinition, leftPercent, topPercent)
        );
      } else {
        hexPlateElement.appendChild(
          createLockedHexTileElement(quadrant, leftPercent, topPercent)
        );
      }
    }
  });
}

function createActiveHexTileElement(coreDefinition, leftPercent, topPercent) {
  const level = coreLevelsById[coreDefinition.id];
  const tileButton = document.createElement('button');
  tileButton.type = 'button';
  tileButton.className = `hex-tile ${QUADRANT_STYLE_CLASS[coreDefinition.quadrant]}${level === 0 ? ' zero' : ''}`;
  tileButton.style.left = leftPercent + '%';
  tileButton.style.top = topPercent + '%';
  tileButton.dataset.coreId = coreDefinition.id;
  tileButton.setAttribute('aria-label', `${coreDefinition.name}，目前等級 ${level}，點擊修改`);
  tileButton.innerHTML = `<span class="hex-name">${coreDefinition.name}</span><span class="hex-lvl">${level}</span>`;
  tileButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openLevelEditor(coreDefinition.id, tileButton);
  });
  return tileButton;
}

function createLockedHexTileElement(quadrant, leftPercent, topPercent) {
  const lockedTile = document.createElement('div');
  lockedTile.className = `hex-tile hex-tile-locked ${QUADRANT_STYLE_CLASS[quadrant]}`;
  lockedTile.style.left = leftPercent + '%';
  lockedTile.style.top = topPercent + '%';
  lockedTile.setAttribute('aria-label', '尚未開放');
  lockedTile.innerHTML = `<span class="hex-lock-icon">🔒</span><span class="hex-name">未開放</span>`;
  return lockedTile;
}

/* -------------------------------------------------------------------------
   點擊六角格彈出的微型輸入編輯器
   ------------------------------------------------------------------------- */
function openLevelEditor(coreId, tileElement) {
  commitAndCloseLevelEditor(); // 先提交上一個還開著的編輯框（若有）
  selectedCoreId = coreId;
  tileElement.classList.add('editing');

  const coreDefinition = CORE_DEFINITIONS.find(c => c.id === coreId);
  const editorElement = document.createElement('div');
  editorElement.className = 'hex-editor';
  editorElement.id = 'activeHexEditor';
  editorElement.style.left = tileElement.style.left;
  editorElement.style.top = `calc(${tileElement.style.top} - 9%)`;
  editorElement.innerHTML = `
    <div class="hex-editor-label">${coreDefinition.name}</div>
    <input type="number" min="0" max="${MAX_CORE_LEVEL}" step="1" value="${coreLevelsById[coreId]}" />
  `;
  hexPlateElement.appendChild(editorElement);

  const inputElement = editorElement.querySelector('input');
  inputElement.focus();
  inputElement.select();

  inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') commitAndCloseLevelEditor();
    else if (event.key === 'Escape') closeLevelEditorWithoutSaving();
  });
  editorElement.addEventListener('click', (event) => event.stopPropagation());
}

function commitAndCloseLevelEditor() {
  const editorElement = document.getElementById('activeHexEditor');
  if (!selectedCoreId || !editorElement) {
    closeLevelEditorWithoutSaving();
    return;
  }
  const inputElement = editorElement.querySelector('input');
  const newLevel = clampCoreLevel(parseInt(inputElement.value, 10) || 0);
  coreLevelsById[selectedCoreId] = newLevel;
  closeLevelEditorWithoutSaving();
  renderHexagonPlate();
  refreshAllProgressSections();
  scheduleAutoSave();
}

function closeLevelEditorWithoutSaving() {
  const editorElement = document.getElementById('activeHexEditor');
  if (editorElement) editorElement.remove();
  document.querySelectorAll('.hex-tile.editing').forEach(el => el.classList.remove('editing'));
  selectedCoreId = null;
}

// 點擊星盤以外的地方：提交並關閉目前編輯框
document.addEventListener('click', () => {
  if (selectedCoreId) commitAndCloseLevelEditor();
});

/* -------------------------------------------------------------------------
   本機儲存（localStorage）
   ------------------------------------------------------------------------- */
function saveCoreLevelsToLocalStorage() {
  clearTimeout(autoSaveTimerId);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ coreLevels: coreLevelsById }));
  } catch (error) {
    console.error('儲存失敗：', error);
  }
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimerId);
  autoSaveTimerId = setTimeout(saveCoreLevelsToLocalStorage, 300);
}

window.addEventListener('beforeunload', saveCoreLevelsToLocalStorage);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveCoreLevelsToLocalStorage();
});

function loadCoreLevelsFromLocalStorage() {
  CORE_DEFINITIONS.forEach(coreDefinition => { coreLevelsById[coreDefinition.id] = 0; });
  try {
    const rawStoredValue = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawStoredValue) {
      const parsedValue = JSON.parse(rawStoredValue);
      applyImportedCoreLevels(parsedValue.coreLevels || parsedValue);
    }
  } catch (error) {
    console.error('讀取本機資料失敗：', error);
  }
}

// 套用一份「id -> 等級」的物件，未知 id 會被忽略，數值會自動夾在 0~30 之間
function applyImportedCoreLevels(candidateLevelsById) {
  if (!candidateLevelsById || typeof candidateLevelsById !== 'object') return false;
  let appliedAnyValue = false;
  CORE_DEFINITIONS.forEach(coreDefinition => {
    const candidateValue = candidateLevelsById[coreDefinition.id];
    if (typeof candidateValue === 'number' && Number.isFinite(candidateValue)) {
      coreLevelsById[coreDefinition.id] = clampCoreLevel(candidateValue);
      appliedAnyValue = true;
    }
  });
  return appliedAnyValue;
}

/* -------------------------------------------------------------------------
   重設全部核心
   ------------------------------------------------------------------------- */
function resetAllCoreLevels() {
  CORE_DEFINITIONS.forEach(coreDefinition => { coreLevelsById[coreDefinition.id] = 0; });
  saveCoreLevelsToLocalStorage();
  renderHexagonPlate();
  refreshAllProgressSections();
}

document.getElementById('resetAllCoresButton').addEventListener('click', (event) => {
  event.stopPropagation();
  const userConfirmedReset = confirm('確定要將所有核心等級歸零嗎？此動作無法復原。');
  if (userConfirmedReset) resetAllCoreLevels();
});

/* -------------------------------------------------------------------------
   備份與讀取管理（3 個本機備份槽：A / B / C）
   與開啟網頁時的自動儲存/自動載入是兩套獨立機制：
   自動儲存永遠寫入 LOCAL_STORAGE_KEY 這個「目前進度」的位置，
   備份槽則是額外的 3 個獨立存檔位置，儲存/載入都需要使用者手動點擊。
   ------------------------------------------------------------------------- */
const BACKUP_SLOT_IDS = ['A', 'B', 'C'];

function getBackupSlotStorageKey(slotId) {
  return `${LOCAL_STORAGE_KEY}-backup-${slotId}`;
}

function formatBackupTimestamp(isoString) {
  const savedDate = new Date(isoString);
  const padTwoDigits = (n) => String(n).padStart(2, '0');
  return `${savedDate.getFullYear()}/${padTwoDigits(savedDate.getMonth() + 1)}/${padTwoDigits(savedDate.getDate())} ${padTwoDigits(savedDate.getHours())}:${padTwoDigits(savedDate.getMinutes())}`;
}

function readBackupSlotData(slotId) {
  const rawStoredValue = localStorage.getItem(getBackupSlotStorageKey(slotId));
  if (!rawStoredValue) return null;
  try {
    return JSON.parse(rawStoredValue);
  } catch (error) {
    console.error(`讀取備份槽 ${slotId} 失敗：`, error);
    return null;
  }
}

function saveCurrentProgressToBackupSlot(slotId) {
  const backupPayload = {
    savedAt: new Date().toISOString(),
    coreLevels: coreLevelsById
  };
  localStorage.setItem(getBackupSlotStorageKey(slotId), JSON.stringify(backupPayload));
  renderBackupSlotList();
}

function loadBackupSlotIntoCurrentProgress(slotId) {
  const backupData = readBackupSlotData(slotId);
  if (!backupData) return;
  applyImportedCoreLevels(backupData.coreLevels);
  saveCoreLevelsToLocalStorage();
  renderHexagonPlate();
  refreshAllProgressSections();
}

function renderBackupSlotList() {
  const backupSlotListContainer = document.getElementById('backupSlotListContainer');
  backupSlotListContainer.innerHTML = BACKUP_SLOT_IDS.map(slotId => {
    const backupData = readBackupSlotData(slotId);
    const timestampText = backupData ? formatBackupTimestamp(backupData.savedAt) : '尚未儲存';
    const hasBackupData = Boolean(backupData);
    return `
      <div class="backup-slot-row d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <div class="fw-semibold">備份槽 ${slotId}</div>
          <div class="small text-muted">${timestampText}</div>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-primary btn-sm backup-save-button" data-slot-id="${slotId}">儲存目前進度</button>
          <button type="button" class="btn btn-outline-secondary btn-sm backup-load-button" data-slot-id="${slotId}" ${hasBackupData ? '' : 'disabled'}>載入此備份</button>
        </div>
      </div>`;
  }).join('');

  backupSlotListContainer.querySelectorAll('.backup-save-button').forEach(buttonElement => {
    buttonElement.addEventListener('click', () => saveCurrentProgressToBackupSlot(buttonElement.dataset.slotId));
  });
  backupSlotListContainer.querySelectorAll('.backup-load-button').forEach(buttonElement => {
    buttonElement.addEventListener('click', () => loadBackupSlotIntoCurrentProgress(buttonElement.dataset.slotId));
  });
}

const backupModalElement = document.getElementById('backupModal');
backupModalElement.addEventListener('show.bs.modal', renderBackupSlotList);

/* -------------------------------------------------------------------------
   初始化
   ------------------------------------------------------------------------- */
function initializeApplication() {
  loadCoreLevelsFromLocalStorage();
  renderHexagonPlate();
  refreshAllProgressSections();
}

initializeApplication();
