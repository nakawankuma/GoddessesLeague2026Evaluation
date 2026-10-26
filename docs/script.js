// 添付された2026年の組分け・対戦日程表を反映。
const tournamentYear = 2026;
const tournamentData = {
    "red-goddesses": {
        "title": "RED GODDESSES",
        "teams": [
            "羽南&月山和香",
            "舞華&HANAKO",
            "さくらあや&玖麗さやか",
            "水森由菜&金屋あんね",
            "星来芽依&儛島エマ",
            "安納サオリ&フワちゃん",
            "スターライト・キッド&伊藤麻希",
            "古沢稀杏&虎龍清花",
            "渡辺桃&上谷沙弥"
        ],
        "matches": []
    },
    "blue-goddesses": {
        "title": "BLUE GODDESSES",
        "teams": [
            "飯田沙耶&林下詩美",
            "妃南&レディ・C",
            "鈴季すず&山下りな",
            "葉月&コグマ",
            "なつぽい&梨杏",
            "八神蘭奈&鉄アキラ",
            "ダーク・シルエタ&バルキリア",
            "刀羅ナツコ&琉悪夏",
            "小波&吏南"
        ],
        "matches": []
    }
};
// 添付日程画像で確認した開催日と正式会場名。
const eventSchedule = [
    { date: '11.1', venue: '後楽園', name: '東京・後楽園ホール' },
    { date: '11.3', venue: '沼津', name: '静岡・キラメッセぬまづ 多目的ホール1' },
    { date: '11.8', venue: '高崎', name: '群馬・Gメッセ群馬 メインホール' },
    { date: '11.11', venue: '後楽園', name: '東京・後楽園ホール' },
    { date: '11.14', venue: '松山', name: '愛媛・アイテムえひめ 小展示場' },
    { date: '11.15', venue: '高知', name: '高知・［CHRES］セリーズ 体育館' },
    { date: '11.18', venue: '後楽園', name: '東京・後楽園ホール' },
    { date: '11.21', venue: '秋田', name: '秋田・秋田テルサ' },
    { date: '11.22', venue: '福島', name: '福島・福島トヨタ クラウンアリーナ メインアリーナ' },
    { date: '11.23', venue: '郡山', name: '福島・ビッグパレットふくしま 多目的ホールA' },
    { date: '11.28', venue: '岡崎', name: '愛知・岡崎市体育館' },
    { date: '11.29', venue: '浜松', name: '静岡・浜松市総合産業展示館 本館第1展示場' }
];
// 対戦表の上三角を行順に転記。各行はチームiとi+1以降の対戦日。
// 画像の群馬・愛媛・福島トヨタ・福島は、日付で既存の正式会場に対応する。
const leagueMatchDates = {
    'red-goddesses': [
        ['11.28', '11.11', '11.18', '11.22', '11.21', '11.14', '11.1', '11.8'],
        ['11.3', '11.23', '11.14', '11.11', '11.18', '11.15', '11.1'],
        ['11.22', '11.18', '11.1', '11.23', '11.21', '11.28'],
        ['11.21', '11.3', '11.8', '11.14', '11.15'],
        ['11.15', '11.1', '11.8', '11.3'],
        ['11.28', '11.22', '11.18'],
        ['11.3', '11.11'],
        ['11.23']
    ],
    'blue-goddesses': [
        ['11.28', '11.3', '11.11', '11.14', '11.8', '11.1', '11.18', '11.23'],
        ['11.8', '11.22', '11.3', '11.23', '11.21', '11.14', '11.15'],
        ['11.23', '11.28', '11.15', '11.11', '11.1', '11.18'],
        ['11.15', '11.21', '11.18', '11.28', '11.1'],
        ['11.11', '11.22', '11.8', '11.21'],
        ['11.14', '11.3', '11.22'],
        ['11.23', '11.28'],
        ['11.11']
    ]
};
Object.entries(tournamentData).forEach(([blockId, block]) => {
    leagueMatchDates[blockId].forEach((dates, i) => {
        dates.forEach((date, offset) => {
            const event = eventSchedule.find(slot => slot.date === date);
            block.matches.push([i, i + offset + 1, date, event.venue]);
        });
    });
});
// 画像で確認できた準決勝2試合と優勝決定戦。
const finalsSchedule = [
    { id: 'red-sf', type: '準決勝①', date: '11.29', venue: '浜松' },
    { id: 'blue-sf', type: '準決勝②', date: '11.29', venue: '浜松' },
    { id: 'final', type: '優勝決定戦', date: '11.29', venue: '浜松' }
];

// グローバルなmatchResultsオブジェクト
let matchResults = {};
let confirmedResults = {}; // 確定済み結果
let predictedResults = {}; // 予想結果（確定データとは別管理）
let confirmedEditMode = false;
let confirmedEditsPending = false;
let editingConfirmedMatch = null;

function openConfirmedEditor(key, player1, player2, reverseKey = null) {
    editingConfirmedMatch = { key, reverseKey };
    const dialog = document.getElementById('confirmed-edit-dialog');
    document.getElementById('confirmed-edit-match').textContent = `${player1} vs ${player2}`;
    document.getElementById('confirmed-win').textContent = `${player1}の勝ち`;
    document.getElementById('confirmed-lose').textContent = `${player2}の勝ち`;
    dialog.querySelector('[data-result="draw"]').hidden = !reverseKey;
    dialog.showModal();
}

function setConfirmedResult(key, result, reverseKey = null) {
    if (result) {
        validateResults({ [key]: result });
        confirmedResults[key] = result;
        if (reverseKey) confirmedResults[reverseKey] = result === 'win' ? 'lose' : result === 'lose' ? 'win' : 'draw';
    } else {
        delete confirmedResults[key];
        if (reverseKey) delete confirmedResults[reverseKey];
    }
    matchResults = { ...predictedResults, ...confirmedResults };
    confirmedEditsPending = true;
}

function buildConfirmedDownload() {
    return { confirmed: { ...confirmedResults }, version: '1.0',
        lastUpdate: new Date().toISOString(), totalMatches: Object.keys(confirmedResults).length };
}

function updateConfirmedEditStatus() {
    document.getElementById('confirmed-edit-status').textContent = confirmedEditsPending
        ? '確定情報を変更しました（未ダウンロード・サイトには未反映）'
        : confirmedEditMode ? '確定情報編集モード：試合を選んで結果を編集できます。サイトへの反映にはファイルの置き換えと公開が必要です。' : '';
}
const blocks = ['red-goddesses', 'blue-goddesses'];

// 選手名の正規化（吏南と更南を同じとして扱う）
function normalizePlayerName(name) {
    // 名前の正規化マッピング
    const nameMapping = {
        '更南': '吏南'
        // 必要に応じて他の選手名のマッピングを追加
    };

    return nameMapping[name] || name;
}

const MAX_RESULTS_BYTES = 128 * 1024;
function validateResults(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('結果はオブジェクトが必要です');
    const raw = Object.hasOwn(data, 'confirmed') ? data.confirmed : data;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('結果の形式が不正です');
    const allowed = new Set(finalsSchedule.map(slot => `tournament-${slot.id}`));
    blocks.forEach(block => tournamentData[block].matches.forEach(([i, j]) => {
        const teams = tournamentData[block].teams;
        allowed.add(`${block}-${teams[i]}-${teams[j]}`);
        allowed.add(`${block}-${teams[j]}-${teams[i]}`);
    }));
    const result = Object.create(null);
    for (const [key, value] of Object.entries(raw)) {
        const normalized = normalizeMatchKey(key);
        if (!allowed.has(normalized) || !['', 'win', 'lose', 'draw'].includes(value) ||
            (normalized.startsWith('tournament-') && value === 'draw')) throw new Error('未対応の試合または勝敗です');
        if (value) result[normalized] = value;
    }
    return result;
}
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}
let modalTrigger;
function openModal(modal) {
    modalTrigger = document.activeElement;
    modal.style.display = 'flex';
    modal.querySelector?.('.modal-close')?.focus();
}
function closeModal(modal) {
    modal.style.display = 'none';
    modalTrigger?.focus?.();
}

// result.jsonの読み込み
async function loadConfirmedResults() {
    try {
        const response = await fetch('result.json');
        if (response.ok) {
            const text = await response.text();
            if (new TextEncoder().encode(text).length > MAX_RESULTS_BYTES) throw new Error('結果ファイルが大きすぎます');
            const data = validateResults(JSON.parse(text));
            // データが直接のマッチ結果オブジェクトか、confirmed形式かを判定
            const rawConfirmedResults = data;

            // 選手名を正規化してキーを変換
            confirmedResults = {};
            Object.keys(rawConfirmedResults).forEach(key => {
                const normalizedKey = normalizeMatchKey(key);

                // 既存のキーと重複チェック
                if (confirmedResults[normalizedKey] && confirmedResults[normalizedKey] !== rawConfirmedResults[key]) {
                    console.warn(`キーの重複検出: ${normalizedKey}, 既存値: ${confirmedResults[normalizedKey]}, 新値: ${rawConfirmedResults[key]}`);
                }

                confirmedResults[normalizedKey] = rawConfirmedResults[key];
                if (key !== normalizedKey) {
                    console.log(`キー正規化: ${key} -> ${normalizedKey}`);
                }
            });

            console.log('=== データ読み込み統計 ===');
            console.log('元のデータ件数:', Object.keys(rawConfirmedResults).length + '件');
            console.log('正規化後データ件数:', Object.keys(confirmedResults).length + '件');
            console.log('データ削減率:', ((Object.keys(rawConfirmedResults).length - Object.keys(confirmedResults).length) / Object.keys(rawConfirmedResults).length * 100).toFixed(1) + '%');
            console.log('確定データを読み込みました:', Object.keys(confirmedResults).length + '件');
            // matchResultsは確定データと予想データをマージ（確定データ優先）
            matchResults = { ...predictedResults, ...confirmedResults };
        } else {
            console.log('result.jsonが見つかりません。確定データなしで開始します。');
        }
    } catch (error) {
        console.log('result.jsonの読み込みに失敗しました:', error.message);
    }
}

// マッチキーの正規化（選手名を正規化）
function normalizeMatchKey(key) {
    // トーナメントキーの場合はそのまま処理
    if (key.startsWith('tournament-')) {
        return key;
    }

    // ブロック名を取得（red-goddesses, blue-goddesses）
    let remainingKey = key;
    let block = '';

    for (const blockName of blocks) {
        if (remainingKey.startsWith(blockName + '-')) {
            block = blockName;
            remainingKey = remainingKey.substring(blockName.length + 1);
            break;
        }
    }

    if (!block) {
        console.warn('不明なブロック名:', key);
        return key;
    }

    // 残りの部分から選手名を抽出（最後の-で分割）
    const lastDashIndex = remainingKey.lastIndexOf('-');
    if (lastDashIndex === -1) {
        console.warn('選手名の分割に失敗:', key);
        return key;
    }

    const player1 = normalizePlayerName(remainingKey.substring(0, lastDashIndex));
    const player2 = normalizePlayerName(remainingKey.substring(lastDashIndex + 1));

    return `${block}-${player1}-${player2}`;
}

// 全ブロックを表示し、全表示ボタンを選択状態にする。
function showAllContent() {
    document.querySelectorAll('.content').forEach(content => content.classList.remove('hidden'));
    document.getElementById('tabs').style.display = 'none';
    document.querySelectorAll('.toggle-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === 'all');
    });
}

// タブ表示の初期ブロックはREDとする。
function showTabView() {
    document.getElementById('tabs').style.display = 'flex';
    showContent('red-goddesses');
    document.querySelectorAll('.toggle-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === 'tabs');
    });
}

// イベントの暗黙参照を使わず、指定ブロックと対応するタブを選択する。
function showContent(contentId) {
    document.querySelectorAll('.content').forEach(content => {
        content.classList.toggle('hidden', content.id !== contentId);
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.block === contentId);
    });
}

function toggleMatchResult(cell) {
    const predictedResultDiv = cell.querySelector('.predicted-result');
    const confirmedResultDiv = cell.querySelector('.confirmed-result');
    const player1 = normalizePlayerName(cell.dataset.player1);
    const player2 = normalizePlayerName(cell.dataset.player2);
    const block = cell.dataset.block;
    const matchKey = `${block}-${player1}-${player2}`;
    const reverseKey = `${block}-${player2}-${player1}`;

    if (confirmedEditMode) {
        openConfirmedEditor(matchKey, player1, player2, reverseKey);
        return;
    }

    console.log('=== toggleMatchResult ===');
    console.log('クリックされたセル:', { player1, player2, block });
    console.log('matchKey:', matchKey);
    console.log('reverseKey:', reverseKey);
    console.log('predictedResults[matchKey]:', predictedResults[matchKey]);
    console.log('predictedResults[reverseKey]:', predictedResults[reverseKey]);

    // 確定済み結果は変更不可（両方のキーをチェック）
    if (confirmedResults[matchKey] || confirmedResults[reverseKey]) {
        console.log('確定済みの結果は変更できません:', matchKey);
        return;
    }

    const statusEl = document.getElementById(`${block}-status`);
    if (statusEl.classList.contains('confirmed')) {
        statusEl.classList.remove('confirmed');
        statusEl.textContent = '';
    }

    // 既存の結果を取得
    const isReverse = cell.dataset.reverse === 'true';
    let currentResult = 'none';

    if (predictedResults[matchKey]) {
        currentResult = predictedResults[matchKey];
        // 下三角のセルでは結果を反転して取得
        if (isReverse) {
            if (currentResult === 'win') currentResult = 'lose';
            else if (currentResult === 'lose') currentResult = 'win';
            // draw は そのまま
        }
        console.log('matchKeyから取得:', predictedResults[matchKey], isReverse ? '(反転)' : '', '->', currentResult);
    } else if (predictedResults[reverseKey]) {
        // reverseKeyに結果がある場合（後方互換性のため）
        const reverseResult = predictedResults[reverseKey];
        if (reverseResult === 'win') currentResult = 'lose';
        else if (reverseResult === 'lose') currentResult = 'win';
        else currentResult = reverseResult; // draw
        console.log('reverseKeyから取得して反転:', reverseResult, '->', currentResult);
    } else {
        console.log('既存結果なし');
    }

    // 次の状態に遷移
    let newResult;
    switch (currentResult) {
        case 'none': newResult = 'win'; break;
        case 'win': newResult = 'draw'; break;
        case 'draw': newResult = 'lose'; break;
        default: newResult = null; break;
    }
    console.log('新しい結果（セル視点）:', currentResult, '->', newResult);

    // 結果を保存（下三角の場合は反転して保存）
    let resultToSave = newResult;
    if (isReverse && resultToSave) {
        if (resultToSave === 'win') resultToSave = 'lose';
        else if (resultToSave === 'lose') resultToSave = 'win';
        // draw は そのまま
        console.log('下三角なので保存時に反転:', newResult, '->', resultToSave);
    }

    if (resultToSave) {
        predictedResults[matchKey] = resultToSave;
        matchResults[matchKey] = resultToSave;

        // 逆の結果も保存（後方互換性のため）
        let oppositeResult;
        if (resultToSave === 'win') oppositeResult = 'lose';
        else if (resultToSave === 'lose') oppositeResult = 'win';
        else oppositeResult = 'draw'; // draw

        predictedResults[reverseKey] = oppositeResult;
        matchResults[reverseKey] = oppositeResult;
        console.log('保存:', matchKey, '=', resultToSave, ',', reverseKey, '=', oppositeResult);
    } else {
        // 結果を削除
        delete predictedResults[matchKey];
        delete predictedResults[reverseKey];
        delete matchResults[matchKey];
        delete matchResults[reverseKey];
        console.log('結果を削除');
    }

    console.log('セルを更新:', matchKey, matchResults[matchKey]);
    updateCellDisplay(cell, matchResults[matchKey], 'predicted');

    // すべてのセルを更新（同じmatchKeyを持つセルをすべて更新）
    console.log('同じ対戦の全セルを更新:', matchKey);
    const allCells = document.querySelectorAll(`#${block} .clickable-cell`);
    console.log('検索対象セル数:', allCells.length);

    for (const testCell of allCells) {
        const testP1 = normalizePlayerName(testCell.dataset.player1);
        const testP2 = normalizePlayerName(testCell.dataset.player2);
        const testBlock = testCell.dataset.block;
        const testMatchKey = `${testBlock}-${testP1}-${testP2}`;

        // 同じmatchKeyを持つセル（クリックしたセル以外）を更新
        if (testMatchKey === matchKey && testCell !== cell) {
            console.log('対応するセルを発見して更新:', testP1, testP2);
            updateCellDisplay(testCell, matchResults[matchKey], 'predicted');
        }
    }

    updatePoints(block);
    console.log('======================');
}

function updateCellDisplay(cell, result, type = 'predicted') {
    const player1 = normalizePlayerName(cell.dataset.player1);
    const player2 = normalizePlayerName(cell.dataset.player2);
    const block = cell.dataset.block;
    const matchKey = `${block}-${player1}-${player2}`;
    const isReverse = cell.dataset.reverse === 'true';

    // 下三角のセルでは結果を反転して表示
    const reverseResult = (res) => {
        if (!isReverse || !res) return res;
        if (res === 'win') return 'lose';
        if (res === 'lose') return 'win';
        return res; // draw
    };

    const confirmedResultDiv = cell.querySelector('.confirmed-result');
    const predictedResultDiv = cell.querySelector('.predicted-result');

    // 確定データの表示
    if (confirmedResults[matchKey]) {
        const confirmedResult = reverseResult(confirmedResults[matchKey]);
        confirmedResultDiv.innerHTML = getResultIcon(confirmedResult);
        confirmedResultDiv.className = 'confirmed-result';
        if(confirmedResult) confirmedResultDiv.classList.add(confirmedResult);

        // セルを確定済みにする（クリック不可）
        cell.classList.add('confirmed-cell');
        cell.classList.remove('clickable-cell');
    } else {
        confirmedResultDiv.innerHTML = '';
        confirmedResultDiv.className = 'confirmed-result';

        // セルをクリック可能にする
        cell.classList.remove('confirmed-cell');
        if (!cell.classList.contains('clickable-cell')) {
            cell.classList.add('clickable-cell');
        }
    }

    // 予想データの表示（predictedResultsから取得）
    const predictedResult = reverseResult(predictedResults[matchKey]);

    if (predictedResult) {
        predictedResultDiv.innerHTML = getResultIcon(predictedResult);
        predictedResultDiv.className = 'predicted-result';
        predictedResultDiv.classList.add(predictedResult);
    } else {
        predictedResultDiv.innerHTML = '';
        predictedResultDiv.className = 'predicted-result';
    }
}

function getResultIcon(result) {
    switch (result) {
        case 'win': return '<i class="fa-regular fa-circle"></i>';
        case 'draw': return '<i class="fa-solid fa-caret-up"></i>';
        case 'lose': return '<i class="fa-solid fa-xmark"></i>';
        default: return '';
    }
}

function updatePoints(block) {
    const rankings = new Map(determineBlockRankings(block).map(team => [team.name, team.rank]));
    const pointCells = document.querySelectorAll(`#${block} .point-column`);
    pointCells.forEach(pointCell => {
        const player = pointCell.dataset.player ? normalizePlayerName(pointCell.dataset.player) : null;

        if (!player) return; // data-playerがない場合はスキップ

        // 確定ポイントの計算
        let confirmedPoints = 0;
        Object.keys(confirmedResults).forEach(key => {
            if (key.startsWith(`${block}-${player}-`)) {
                const result = confirmedResults[key];
                if (result === 'win') confirmedPoints += 2;
                if (result === 'draw') confirmedPoints += 1;
            }
        });

        // 予想ポイントの計算（確定ポイント + 予想データのポイント）
        let predictedPoints = confirmedPoints;
        Object.keys(predictedResults).forEach(key => {
            if (key.startsWith(`${block}-${player}-`) && !confirmedResults[key]) {
                const result = predictedResults[key];
                if (result === 'win') predictedPoints += 2;
                if (result === 'draw') predictedPoints += 1;
            }
        });

        // 点数表示を更新
        const rankSpan = pointCell.querySelector('.block-rank');
        const predictedPointsSpan = pointCell.querySelector('.predicted-points');

        if (rankSpan) rankSpan.textContent = rankings.get(player);
        if (predictedPointsSpan) predictedPointsSpan.textContent = predictedPoints;
    });
    checkCompletionAndRank(block);
}

function isBlockComplete(block) {
    const players = getPlayersInBlock(block);
    const totalMatches = players.length * (players.length - 1) / 2;
    let completedMatches = 0;
    const checkedMatches = new Set();

    players.forEach(p1 => {
        players.forEach(p2 => {
            if (p1 === p2) return;
            const matchKey = [p1, p2].sort().join('-');
            if (checkedMatches.has(matchKey)) return;

            const key = `${block}-${p1}-${p2}`;
            if (matchResults[key]) {
                completedMatches++;
            }
            checkedMatches.add(matchKey);
        });
    });

    return completedMatches >= totalMatches;
}

/**
 * ブロック内の全選手を取得
 * @param {string} block - ブロックID（red-goddesses / blue-goddesses）
 * @returns {Array<string>} 選手名の配列
 */
function getPlayersInBlock(block) {
    // tournamentDataから直接取得（DOMに依存しない）
    const blockData = tournamentData[block];
    if (!blockData || !blockData.teams) {
        console.error(`ブロックデータが見つかりません: ${block}`);
        return [];
    }
    return blockData.teams.map(team => normalizePlayerName(team));
}

function determineBlockRankings(block) {
    const players = getPlayersInBlock(block);
    const playerStats = players.map(player => ({
        name: player,
        points: 0,
        opponents: {}
    }));

    playerStats.forEach(stat => {
        let points = 0;
        Object.keys(matchResults).forEach(key => {
            if (key.startsWith(`${block}-${stat.name}-`)) {
                const result = matchResults[key];
                if (result === 'win') points += 2;
                if (result === 'draw') points += 1;
                const opponent = normalizePlayerName(key.substring(`${block}-${stat.name}-`.length));
                stat.opponents[opponent] = result;
            }
        });
        stat.points = points;
    });

    playerStats.sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        const directResult = a.opponents[b.name];
        if (directResult === 'win') return -1;
        if (directResult === 'lose') return 1;
        return 0;
    });

    // 順位を付与
    playerStats.forEach((stat, index) => {
        stat.rank = index + 1;
    });

    return playerStats;
}

/**
 * トーナメントブラケットの選手情報を更新
 * @param {string} block - ブロックID（red-goddesses / blue-goddesses）
 * @param {Array<Object>} rankings - 順位データ（上位2チーム）
 */
function updateTournamentBracket(block, rankings) {
    const blockShort = block.replace('-goddesses', ''); // 'red' or 'blue'

    // 上位2チームのみトーナメントに反映
    const topThree = rankings.slice(0, 2);

    topThree.forEach((player, index) => {
        const rank = index + 1; // 1, 2, 3
        const rankElement = document.getElementById(`bracket-${blockShort}-${rank}-rank`);

        if (rankElement) {
            rankElement.textContent = `${rank}位 ${player.name}`;
        } else {
            console.warn(`トーナメント要素が見つかりません: bracket-${blockShort}-${rank}-rank`);
        }
    });

    console.log(`${blockShort.toUpperCase()} GODDESSES の順位をトーナメントに反映しました:`, topThree);
}

/**
 * 入力のたびに暫定順位を計算してトーナメントに反映
 * @param {string} block - ブロックID（red-goddesses / blue-goddesses）
 */
function checkCompletionAndRank(block) {
    const statusEl = document.getElementById(`${block}-status`);

    // status要素が存在しない場合は処理をスキップ（テーブル生成前の呼び出しを防ぐ）
    if (!statusEl) {
        console.warn(`status要素が見つかりません: ${block}-status`);
        return;
    }

    const hasResults = Object.keys(matchResults).some(key => key.startsWith(`${block}-`) && matchResults[key]);
    const complete = isBlockComplete(block);
    if (hasResults) {
        updateTournamentBracket(block, determineBlockRankings(block));
    } else {
        const blockShort = block.replace('-goddesses', '');
        [1, 2].forEach(rank => {
            const element = document.getElementById(`bracket-${blockShort}-${rank}-rank`);
            if (element) element.textContent = `${rank}位`;
        });
    }

    if (complete) {
        statusEl.textContent = 'ブロック順位（確定結果＋予想・全試合入力済み）';
        statusEl.classList.add('confirmed');
    } else {
        statusEl.textContent = hasResults ? '暫定ブロック順位（確定結果＋予想）' : '';
        statusEl.classList.remove('confirmed');
    }
    updateTournamentWinners();
}

function showPlayerSchedule(playerName) {
    const normalizedPlayerName = normalizePlayerName(playerName);
    const modal = document.getElementById('schedule-modal');
    const modalPlayerName = document.getElementById('modal-player-name');
    const modalScheduleBody = document.getElementById('modal-schedule-body');
    const matches = [];

    // 大会データから両側のチームを検索し、同じ対戦を重複させない。
    blocks.forEach(block => {
        const data = tournamentData[block];
        const teamIndex = data.teams.indexOf(playerName);
        data.matches.forEach(([i, j, dateText, venue]) => {
            if (i !== teamIndex && j !== teamIndex) return;
            const [month, day] = dateText.split('.').map(Number);
            matches.push({ date: dateText === '未定' ? Infinity : new Date(tournamentYear, month - 1, day).getTime(),
                dateText, opponent: data.teams[i === teamIndex ? j : i], venue, block });
        });
    });
    matches.sort((a, b) => a.date - b.date);

    modalPlayerName.textContent = `${playerName} - 対戦スケジュール`;
    let scheduleHtml = '<table><thead><tr><th>日付</th><th>対戦相手</th><th>会場</th><th>確定勝敗</th><th>予想勝敗</th></tr></thead><tbody>';
    if (matches.length > 0) {
        matches.forEach(match => {
            const matchKey = `${match.block}-${normalizedPlayerName}-${match.opponent}`;
            const confirmedResult = confirmedResults[matchKey];
            const predictedResult = predictedResults[matchKey];

            const confirmedIcon = getResultIcon(confirmedResult);
            const predictedIcon = getResultIcon(predictedResult);

            scheduleHtml += `<tr>
                <td>${match.dateText}</td>
                <td>${match.opponent}</td>
                <td>${match.venue}</td>
                <td class="result-cell ${escapeHtml(confirmedResult || '')}">${confirmedIcon}</td>
                <td class="result-cell ${escapeHtml(predictedResult || '')}">${predictedIcon}</td>
            </tr>`;
        });
    } else {
        scheduleHtml += '<tr><td colspan="5">対戦予定はありません。</td></tr>';
    }
    scheduleHtml += '</tbody></table>';
    modalScheduleBody.innerHTML = scheduleHtml;
    openModal(modal);
}

// トーナメント勝者の実際の選手名を取得
function getActualTournamentWinner(winnerId) {
    // winnerIdから対応する試合IDを取得
    const matchId = winnerId.replace('-winner', '');
    const matchKey = `tournament-${matchId}`;
    const result = matchResults[matchKey];

    if (!result) return null;

    // 試合結果から勝者を特定
    if (result === 'win') {
        return getTournamentPlayer1(matchId);
    } else if (result === 'lose') {
        return getTournamentPlayer2(matchId);
    }

    return null;
}

function showVenueSchedule(venueName, date) {
    const modal = document.getElementById('venue-modal');
    const modalVenueName = document.getElementById('modal-venue-name');
    const modalVenueBody = document.getElementById('modal-venue-body');
    const matches = [];

    // リーグ戦の試合を収集
    document.querySelectorAll('.clickable-cell, .confirmed-cell').forEach(cell => {
        const venueEl = cell.querySelector('.venue');
        const dateEl = cell.querySelector('.date');
        if (venueEl && venueEl.textContent === venueName && dateEl && dateEl.textContent === date) {
            const player1 = cell.dataset.player1;
            const player2 = cell.dataset.player2;
            const block = cell.dataset.block;
            const matchKey = `${block}-${normalizePlayerName(player1)}-${normalizePlayerName(player2)}`;
            const result = matchResults[matchKey];

            matches.push({
                player1: player1,
                player2: player2,
                result: result,
                date: date,
                block: block,
                type: 'リーグ戦'
            });
        }
    });

    // 同じ日・会場の決勝トーナメントだけを追加。
    finalsSchedule.filter(slot => slot.date === date && slot.venue === venueName).forEach(slot => {
        matches.push({ player1: getTournamentPlayer1(slot.id), player2: getTournamentPlayer2(slot.id),
            date, block: 'トーナメント', type: slot.type, match_id: slot.id });
    });

    modalVenueName.textContent = `${venueName} (${date}) - 試合一覧`;
    let scheduleHtml = '<table><thead><tr><th>試合形式</th><th>ブロック</th><th>選手1</th><th>vs</th><th>選手2</th><th>確定勝敗</th><th>予想勝敗</th></tr></thead><tbody>';
    if (matches.length > 0) {
        const uniqueMatches = [];
        const seenMatchKeys = new Set();

        matches.forEach(match => {
            const keyPrefix = match.type === 'リーグ戦' ? match.block : match.type;
            const key1 = `${keyPrefix}-${match.player1}-${match.player2}`;
            const key2 = `${keyPrefix}-${match.player2}-${match.player1}`;

            if (!seenMatchKeys.has(key1) && !seenMatchKeys.has(key2)) {
                uniqueMatches.push(match);
                seenMatchKeys.add(key1);
            }
        });

        uniqueMatches.forEach(match => {
            let confirmedResult = null;
            let predictedResult = null;

            if (match.type === 'リーグ戦') {
                // リーグ戦の場合、matchKeyを使って確定・予想結果を取得
                const matchKey = `${match.block}-${normalizePlayerName(match.player1)}-${normalizePlayerName(match.player2)}`;
                confirmedResult = confirmedResults[matchKey];
                predictedResult = predictedResults[matchKey];
            } else {
                // トーナメントの場合
                const tournamentKey = `tournament-${match.match_id || ''}`;
                confirmedResult = confirmedResults[tournamentKey];
                predictedResult = predictedResults[tournamentKey];
            }

            const confirmedIcon = getResultIcon(confirmedResult);
            const predictedIcon = getResultIcon(predictedResult);

            scheduleHtml += `<tr>
                <td>${match.type}</td>
                <td>${match.block}</td>
                <td>${match.player1}</td>
                <td>vs</td>
                <td>${match.player2}</td>
                <td class="result-cell ${escapeHtml(confirmedResult || '')}">${confirmedIcon}</td>
                <td class="result-cell ${escapeHtml(predictedResult || '')}">${predictedIcon}</td>
            </tr>`;
        });
    } else {
        scheduleHtml += '<tr><td colspan="7">この日の対戦カードは未登録です。</td></tr>';
    }
    scheduleHtml += '</tbody></table>';
    modalVenueBody.innerHTML = scheduleHtml;
    openModal(modal);
}

function refreshAllTables() {
    blocks.forEach(blockId => {
        const table = document.querySelector(`#${blockId} .schedule-table`);
        if (!table) return;

        table.querySelectorAll('.clickable-cell, .confirmed-cell').forEach(cell => {
            const player1 = normalizePlayerName(cell.dataset.player1);
            const player2 = normalizePlayerName(cell.dataset.player2);
            const block = cell.dataset.block;
            const matchKey = `${block}-${player1}-${player2}`;
            const result = predictedResults[matchKey];
            updateCellDisplay(cell, result, 'predicted');
        });

        updatePoints(blockId);
    });

    // トーナメント結果も復元
    refreshTournamentResults();
}

// トーナメント結果の復元機能
function refreshTournamentResults() {
    const tournamentMatches = finalsSchedule.map(slot => slot.id);

    tournamentMatches.forEach(matchId => {
        const matchKey = `tournament-${matchId}`;
        const result = matchResults[matchKey];

        if (result) {
            updateTournamentResultDisplay(matchId, result);
        } else {
            updateTournamentResultDisplay(matchId, null);
        }
    });
}

// 元のトーナメントブラケット表示を使用（ライブラリなし）
function initializeTournamentBracket() {
    // 既にHTMLで定義されているため、特別な初期化は不要
}

// トーナメント試合結果の管理機能
function toggleTournamentMatchResult(matchId) {
    const matchKey = `tournament-${matchId}`;
    if (confirmedEditMode) {
        openConfirmedEditor(matchKey, getTournamentPlayer1(matchId), getTournamentPlayer2(matchId));
        return;
    }
    const resultElement = document.getElementById(`${matchId}-result`);

    if (confirmedResults[matchKey]) return;
    let currentResult = matchResults[matchKey] || 'none';

    switch (currentResult) {
        case 'none':
            matchResults[matchKey] = 'win';
            updateTournamentResultDisplay(matchId, 'win');
            break;
        case 'win':
            matchResults[matchKey] = 'lose';
            updateTournamentResultDisplay(matchId, 'lose');
            break;
        default:
            delete matchResults[matchKey];
            updateTournamentResultDisplay(matchId, null);
            break;
    }

    if (matchResults[matchKey]) predictedResults[matchKey] = matchResults[matchKey];
    else delete predictedResults[matchKey];
    // トーナメント勝者を更新
    updateTournamentWinners();
}

// トーナメント結果表示の更新
function updateTournamentResultDisplay(matchId, result) {
    const resultElement = document.getElementById(`${matchId}-result`);
    if (!resultElement) return;

    if (!result) {
        resultElement.textContent = '';
        return;
    }

    // 各試合の勝者名を取得して表示
    let winnerName = '';

    if (result === 'win') {
        winnerName = getTournamentPlayer1(matchId);
    } else if (result === 'lose') {
        winnerName = getTournamentPlayer2(matchId);
    }

    if (winnerName && winnerName !== '未定') {
        // 勝者名を表示（長い場合は短縮）
        const displayName = winnerName.length > 8 ? winnerName.substring(0, 7) + '…' : winnerName;
        resultElement.textContent = displayName;
    } else {
        resultElement.textContent = result === 'win' ? '○' : '×';
    }
}

// トーナメント試合の選手1を取得
// 順位未確定ならブロック順位を表示する。
function getRankedTeam(block, rank) {
    const text = document.getElementById(`bracket-${block}-${rank}-rank`)?.textContent || '';
    return text.includes(' ') ? text.split(' ').slice(1).join(' ') : `${block.toUpperCase()} ${rank}位`;
}
// 準決勝は同ブロック1位、決勝はRED準決勝勝者。
function getTournamentPlayer1(matchId) {
    if (matchId === 'red-sf') return getRankedTeam('red', 1);
    if (matchId === 'blue-sf') return getRankedTeam('blue', 1);
    if (matchId === 'final') return getMatchWinner('red-sf') || '準決勝①の勝者';
    return '未定';
}
// 準決勝は同ブロック2位、決勝はBLUE準決勝勝者。
function getTournamentPlayer2(matchId) {
    if (matchId === 'red-sf') return getRankedTeam('red', 2);
    if (matchId === 'blue-sf') return getRankedTeam('blue', 2);
    if (matchId === 'final') return getMatchWinner('blue-sf') || '準決勝②の勝者';
    return '未定';
}

// 試合の勝者を取得
function getMatchWinner(matchId) {
    const matchKey = `tournament-${matchId}`;
    const result = matchResults[matchKey];

    if (result === 'win') {
        return getTournamentPlayer1(matchId);
    } else if (result === 'lose') {
        return getTournamentPlayer2(matchId);
    }

    return null;
}

// トーナメント勝者の自動反映機能
function updateTournamentWinners() {
    updateDependentMatches();
    updateChampionDisplay();
}
// 準決勝から決勝への勝者表示を更新。
function updateDependentMatches() {
    finalsSchedule.forEach(slot => updateTournamentResultDisplay(slot.id, matchResults[`tournament-${slot.id}`]));
}

// 優勝者表示の更新
function updateChampionDisplay() {
    const finalResult = matchResults['tournament-final'];
    const championDisplay = document.getElementById('champion-display');
    const championText = document.getElementById('champion-text');

    if (finalResult) {
        // 決勝の勝者を取得
        let champion = null;
        if (finalResult === 'win') {
            champion = getTournamentPlayer1('final');
        } else if (finalResult === 'lose') {
            champion = getTournamentPlayer2('final');
        }

        if (champion && champion !== '未定') {
            // 優勝者を表示
            championText.textContent = `${champion}優勝！`;
            championDisplay.style.display = 'block';

            // 勝利の効果音やアニメーションを追加（将来的な拡張用）
            triggerChampionCelebration();
        } else {
            // 決勝は設定されているが勝者が未定
            championDisplay.style.display = 'none';
        }
    } else {
        // 決勝の結果がまだ設定されていない
        championDisplay.style.display = 'none';
    }
}

// 優勝者決定時の演出
function triggerChampionCelebration() {
    const championDisplay = document.getElementById('champion-display');

    // 一時的にさらに大きなアニメーションを追加
    championDisplay.style.animation = 'championReveal 1s ease-out';

    // 数秒後に通常のアニメーションに戻す
    setTimeout(() => {
        championDisplay.style.animation = '';
    }, 1000);
}

// 優勝者表示用の追加CSS（動的に追加）
function addChampionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes championReveal {
            0% {
                transform: scale(0.5) rotate(-10deg);
                opacity: 0;
            }
            50% {
                transform: scale(1.2) rotate(5deg);
                opacity: 1;
            }
            100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', async function() {
    const editConfirmedButton = document.getElementById('edit-confirmed-btn');
    editConfirmedButton.addEventListener('click', () => {
        confirmedEditMode = !confirmedEditMode;
        editConfirmedButton.setAttribute('aria-pressed', String(confirmedEditMode));
        editConfirmedButton.textContent = confirmedEditMode ? '確定情報編集を終了' : '確定情報編集';
        document.body.classList.toggle('confirmed-edit-mode', confirmedEditMode);
        updateConfirmedEditStatus();
    });
    const confirmedDialog = document.getElementById('confirmed-edit-dialog');
    confirmedDialog.querySelectorAll('[data-result]').forEach(button => {
        button.addEventListener('click', () => {
            const {key, reverseKey} = editingConfirmedMatch;
            setConfirmedResult(key, button.dataset.result || null, reverseKey);
            refreshAllTables();
            updateTournamentWinners();
            updateConfirmedEditStatus();
            confirmedDialog.close();
        });
    });
    document.getElementById('confirmed-edit-cancel').addEventListener('click', () => confirmedDialog.close());
    window.addEventListener('beforeunload', event => {
        if (confirmedEditsPending) { event.preventDefault(); event.returnValue = ''; }
    });
    const headerFontSize = document.getElementById('header-font-size');
    const headerFontSizeValue = document.getElementById('header-font-size-value');
    headerFontSize.addEventListener('input', () => {
        const size = Number(headerFontSize.value).toFixed(1) + 'rem';
        document.documentElement.style.setProperty('--table-header-font-size', size);
        headerFontSizeValue.value = size;
    });

    document.querySelector('[data-view="all"]').addEventListener('click', showAllContent);
    document.querySelector('[data-view="tabs"]').addEventListener('click', showTabView);
    document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => showContent(tab.dataset.block)));
    // 確定データを読み込み
    await loadConfirmedResults();

    // 優勝者表示用のCSSを追加
    addChampionStyles();

    // トーナメントブラケットを初期化（jQueryが読み込まれた後）
    setTimeout(initializeTournamentBracket, 500);

    // トーナメントボックスにクリックイベントを追加
    setTimeout(() => {
        document.querySelectorAll('.tournament-match-box').forEach(box => {
            box.style.cursor = 'pointer';
            box.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const matchId = this.getAttribute('data-match');
                console.log('Tournament box clicked:', matchId);
                toggleTournamentMatchResult(matchId);
            });
        });
        console.log('Tournament boxes initialized:', document.querySelectorAll('.tournament-match-box').length);
    }, 1000);


    const scheduleModal = document.getElementById('schedule-modal');
    const scheduleModalClose = scheduleModal.querySelector('.modal-close');
    scheduleModalClose.addEventListener('click', () => { closeModal(scheduleModal); });
    scheduleModal.addEventListener('click', (e) => { if (e.target === scheduleModal) closeModal(scheduleModal); });

    const venueModal = document.getElementById('venue-modal');
    const venueModalClose = venueModal.querySelector('.modal-close');
    venueModalClose.addEventListener('click', () => { closeModal(venueModal); });
    venueModal.addEventListener('click', (e) => { if (e.target === venueModal) closeModal(venueModal); });

    // ヘルプモーダルの設定
    const helpModal = document.getElementById('help-modal');
    const helpBtn = document.getElementById('help-btn');
    const helpModalClose = helpModal.querySelector('.modal-close');

    helpBtn.addEventListener('click', () => { openModal(helpModal); });
    helpModalClose.addEventListener('click', () => { closeModal(helpModal); });
    helpModal.addEventListener('click', (e) => { if (e.target === helpModal) closeModal(helpModal); });

    document.addEventListener('keydown', event => {
        const modal = [scheduleModal, venueModal, helpModal].find(item => item.style.display === 'flex');
        if (!modal) return;
        if (event.key === 'Escape') { event.preventDefault(); closeModal(modal); }
        if (event.key === 'Tab') {
            const controls = [...modal.querySelectorAll('button, a[href], input, [tabindex="0"]')];
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });

    // Download/Upload functionality
    const downloadBtn = document.getElementById('download-btn');
    const downloadConfirmedBtn = document.getElementById('download-confirmed-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadInput = document.getElementById('upload-input');

    downloadBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(predictedResults, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'predicted-results.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 確定データダウンロード機能
    downloadConfirmedBtn.addEventListener('click', () => {
        const confirmedData = buildConfirmedDownload();
        const dataStr = JSON.stringify(confirmedData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'result.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        confirmedEditsPending = false;
        document.getElementById('confirmed-edit-status').textContent = '確定情報をダウンロードしました（サイトには未反映）。result.jsonを置き換えて公開してください。';
    });

    uploadBtn.addEventListener('click', () => uploadInput.click());

    uploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > MAX_RESULTS_BYTES) { alert('ファイルは128 KiB以下にしてください。'); uploadInput.value = ''; return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = validateResults(JSON.parse(e.target.result));
                // Basic validation
                if (typeof data === 'object' && data !== null) {
                    // データが直接のマッチ結果オブジェクトか、confirmed形式かを判定
                    const rawLoadedResults = data;

                    // アップロードされたデータの選手名を正規化
                    const loadedResults = {};
                    Object.keys(rawLoadedResults).forEach(key => {
                        const normalizedKey = normalizeMatchKey(key);

                        // 既存のキーと重複チェック
                        if (loadedResults[normalizedKey] && loadedResults[normalizedKey] !== rawLoadedResults[key]) {
                            console.warn(`アップロード時キーの重複検出: ${normalizedKey}, 既存値: ${loadedResults[normalizedKey]}, 新値: ${rawLoadedResults[key]}`);
                        }

                        loadedResults[normalizedKey] = rawLoadedResults[key];
                        if (key !== normalizedKey) {
                            console.log(`アップロード時キー正規化: ${key} -> ${normalizedKey}`);
                        }
                    });

                    console.log('=== アップロード統計 ===');
                    console.log('元のデータ件数:', Object.keys(rawLoadedResults).length + '件');
                    console.log('正規化後データ件数:', Object.keys(loadedResults).length + '件');
                    console.log('データ削減率:', ((Object.keys(rawLoadedResults).length - Object.keys(loadedResults).length) / Object.keys(rawLoadedResults).length * 100).toFixed(1) + '%');

                    // アップロードされたデータを予想データとして保存
                    predictedResults = { ...loadedResults };
                    // matchResultsは確定データと予想データをマージ（確定データ優先）
                    matchResults = { ...predictedResults, ...confirmedResults };

                    const confirmedCount = Object.keys(confirmedResults).length;
                    const uploadedCount = Object.keys(loadedResults).length;
                    const totalCount = Object.keys(matchResults).length;

                    refreshAllTables();
                    updateChampionDisplay(); // 優勝者表示も更新
                    alert(`結果を正常に読み込みました。\n確定済み: ${confirmedCount}件\nアップロード: ${uploadedCount}件\n合計: ${totalCount}件`);
                    console.log('マージ完了 - 確定:', confirmedCount, 'アップロード:', uploadedCount, '合計:', totalCount);
                } else {
                    alert('無効なファイル形式です。');
                }
            } catch (error) {
                alert('ファイルの読み込み中にエラーが発生しました。');
                console.error("Error parsing JSON:", error);
            }
        };
        reader.readAsText(file);
        uploadInput.value = ''; // Reset input
    });

    // テーブルを動的生成（status要素を含むDOMを先に生成）
    generateTables();

    // 確定データ読み込み後にテーブルを更新
    refreshAllTables();

    // 初期状態で優勝者表示をチェック
    updateChampionDisplay();

    // 初期状態でトーナメントブラケットを更新（確定データがある場合）
    // generateTables()の後に呼び出す必要がある（status要素が生成されている必要があるため）
    blocks.forEach(block => {
        checkCompletionAndRank(block);
    });

    // 日付・会場対応表を動的生成
    generateVenueScheduleTable();
});

// テーブル動的生成関数
function generateTables() {
    blocks.forEach(blockId => {
        const blockData = tournamentData[blockId];
        if (!blockData) return;

        const container = document.getElementById(blockId);
        if (!container) return;

        // テーブルHTMLを生成
        const tableHTML = generateBlockTable(blockId, blockData);
        container.innerHTML = tableHTML;
    });

    // 動的生成されたセルにイベントリスナーを追加
    document.querySelectorAll('.clickable-cell').forEach(cell => {
        cell.addEventListener('click', function() { toggleMatchResult(this); });
    });

    // チーム名クリックでスケジュール表示
    document.querySelectorAll('.player-name, thead th').forEach(cell => {
        const playerName = cell.textContent.trim();
        if (playerName && !cell.classList.contains('rest-column') && !cell.classList.contains('point-column')) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                showPlayerSchedule(playerName);
            });
        }
    });
}

function generateBlockTable(blockId, blockData) {
    const { title, teams, matches } = blockData;
    const colorClass = blockId.includes('red') ? 'red' : 'blue';

    // ヘッダー生成
    let html = `
        <div class="block-title ${colorClass}-title">${title}</div>
        <div id="${blockId}-status" class="block-status"></div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="${colorClass}-header"></th>`;

    teams.forEach(team => {
        html += `<th class="${colorClass}-header">${team}</th>`;
    });

    html += `
                    <th class="${colorClass}-header rest-column">休み</th>
                    <th class="${colorClass}-header point-column">順位（勝ち点）</th>
                </tr>
            </thead>
            <tbody>`;

    // 対戦マトリックス生成
    teams.forEach((team1, i) => {
        html += `<tr><td class="player-name ${colorClass}-player">${team1}</td>`;

        teams.forEach((team2, j) => {
            if (i === j) {
                html += `<td class="diagonal"></td>`;
            } else {
                const match = findMatch(matches, i, j);
                if (match) {
                    const [t1, t2, date, venue] = match;
                    // 総当たり戦なので全セルをクリック可能にする
                    // ただし、data属性は常にマッチデータの順序（t1, t2）で統一
                    const player1 = teams[t1];
                    const player2 = teams[t2];
                    // 下三角のセルには data-reverse="true" を設定（結果を反転表示するため）
                    const isLowerTriangle = (i > j);
                    const reverseAttr = isLowerTriangle ? 'data-reverse="true"' : '';
                    const dataAttrs = `data-player1="${player1}" data-player2="${player2}" data-block="${blockId}" ${reverseAttr}`;

                    html += `<td class="match-info clickable-cell" ${dataAttrs}>
                        <div class="date">${date}</div>
                        <div class="venue">${venue}</div>
                        <div class="match-results">
                            <div class="confirmed-result"></div>
                            <div class="predicted-result"></div>
                        </div>
                    </td>`;
                } else {
                    html += `<td class="match-info"></td>`;
                }
            }
        });

        html += `
            <td class="rest-column match-info"></td>
            <th class="point-column" data-player="${team1}">
                <span class="block-rank">${teams.indexOf(team1) + 1}</span>位(<span class="predicted-points">0</span>)
            </th>
        </tr>`;
    });

    html += `
            </tbody>
        </table>`;

    return html;
}

function findMatch(matches, i, j) {
    // マッチデータから該当する対戦を検索
    return matches.find(m =>
        (m[0] === i && m[1] === j) || (m[0] === j && m[1] === i)
    );
}
// 日付・会場対応表を動的生成する関数
function generateVenueScheduleTable() {
    const venueMap = new Map(eventSchedule.map(event => [event.date, event.venue]));

    // 全ブロックから日付・会場情報を収集（リーグ戦）
    blocks.forEach(blockId => {
        const blockData = tournamentData[blockId];
        if (!blockData) return;

        blockData.matches.forEach(match => {
            const [t1, t2, date, venue] = match;
            if (date !== '未定' && venue !== '未定') venueMap.set(date, venue);
        });
    });

    // トーナメント日程を追加
    finalsSchedule.forEach(slot => venueMap.set(slot.date, slot.venue));

    // 日付でソート
    const sortedDates = Array.from(venueMap.keys()).sort((a, b) => {
        const [monthA, dayA] = a.split('.').map(Number);
        const [monthB, dayB] = b.split('.').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
    });

    // テーブルHTML生成
    let html = '';
    sortedDates.forEach(date => {
        const venue = venueMap.get(date);
        const venueName = eventSchedule.find(event => event.date === date && event.venue === venue)?.name || venue;
        html += `<tr>
            <td>${date}</td>
            <td data-venue="${escapeHtml(venue)}" data-date="${escapeHtml(date)}" style="cursor: pointer;">${venueName}</td>
        </tr>`;
    });

    // DOMに挿入
    const tbody = document.querySelector('.venue-list-section tbody');
    if (tbody) {
        tbody.innerHTML = html;
        tbody.querySelectorAll?.('[data-venue]').forEach(cell => {
            cell.addEventListener('click', () => showVenueSchedule(cell.dataset.venue, cell.dataset.date));
        });
    }
}
