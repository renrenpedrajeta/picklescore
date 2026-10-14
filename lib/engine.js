export class PickleballEngine {
  constructor(options = {}) {
    this.format = options.format || 'doubles'; // 'doubles' | 'singles'
    this.targetScore = options.targetScore || 11;
    this.winBy = options.winBy || 2;
    this.teamKeys = options.teamKeys || ['omega', 'alpha'];
    this.teamNames = options.teamNames || ['Team Omega', 'Team Alpha'];
    this.playerNames = options.playerNames || {
      team0: ['Player 1', 'Player 2'],
      team1: ['Player 3', 'Player 4'],
    };
    this.teamPalettes = options.teamPalettes || ['omega', 'alpha'];
    this.reset();
  }

  reset() {
    this.scores = [0, 0];
    this.servingTeam = 0; // 0 (omega) or 1 (alpha)
    // First serve of a game: the first serving team starts as server 2 (0-0-2)
    this.serverNumber = this.format === 'doubles' ? 2 : 1;
    this.serverCourt = 'right'; // 'right' or 'left'
    this.courtPositions = [
      { left: this.playerNames.team0[1], right: this.playerNames.team0[0] },
      { left: this.playerNames.team1[1], right: this.playerNames.team1[0] },
    ];
    this.gameOver = false;
    this.winner = null;
    this.history = [];
    this.redoStack = [];
    this.log = [];
  }

  saveSnapshot() {
    return JSON.stringify({
      format: this.format,
      scores: [...this.scores],
      servingTeam: this.servingTeam,
      serverNumber: this.serverNumber,
      courtPositions: JSON.parse(JSON.stringify(this.courtPositions)),
      serverCourt: this.serverCourt,
      gameOver: this.gameOver,
      winner: this.winner,
      teamPalettes: [...this.teamPalettes],
      teamNames: [...this.teamNames],
      teamKeys: [...this.teamKeys],
      log: [...this.log],
    });
  }

  restoreSnapshot(jsonStr) {
    const snap = JSON.parse(jsonStr);
    this.format = snap.format || 'doubles';
    this.scores = Array.isArray(snap.scores) ? [...snap.scores] : [0, 0];
    this.servingTeam = snap.servingTeam ?? 0;
    this.serverNumber = snap.serverNumber ?? (this.format === 'doubles' ? 2 : 1);
    if (snap.courtPositions) {
      this.courtPositions = snap.courtPositions;
    }
    this.serverCourt = snap.serverCourt || 'right';
    this.gameOver = Boolean(snap.gameOver);
    this.winner = snap.winner ?? null;
    if (Array.isArray(snap.teamPalettes)) {
      this.teamPalettes = [...snap.teamPalettes];
    }
    if (Array.isArray(snap.teamNames)) {
      this.teamNames = [...snap.teamNames];
    }
    if (Array.isArray(snap.teamKeys)) {
      this.teamKeys = [...snap.teamKeys];
    }
    this.log = Array.isArray(snap.log) ? [...snap.log] : [];
  }

  pointWon(elapsedSeconds = 0) {
    if (this.gameOver) {
      return { event: 'gameWon', winner: this.winner, scores: [...this.scores] };
    }

    this.history.push(this.saveSnapshot());
    this.redoStack = [];
    this.scores[this.servingTeam] = Math.min(99, this.scores[this.servingTeam] + 1);

    const sScore = this.scores[this.servingTeam];
    const rScore = this.scores[1 - this.servingTeam];

    let wonMatch = false;
    if (sScore >= this.targetScore && sScore - rScore >= this.winBy) {
      this.gameOver = true;
      this.winner = this.servingTeam;
      wonMatch = true;
    }

    if (this.format === 'doubles') {
      const current = this.courtPositions[this.servingTeam];
      this.courtPositions[this.servingTeam] = { left: current.right, right: current.left };
      this.serverCourt = this.serverCourt === 'right' ? 'left' : 'right';
    } else {
      this.serverCourt = this.scores[this.servingTeam] % 2 === 0 ? 'right' : 'left';
    }

    const srvNum = this.serverNumber ?? 1;
    const call = `${sScore}\u2013${rScore}\u2013${srvNum}`;
    const message = wonMatch
      ? `🏆 ${this.teamNames[this.servingTeam]} won the match (${sScore}\u2013${rScore})`
      : `${this.teamNames[this.servingTeam]} scored`;
    const elapsed = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));
    const logEntry = { elapsed, message, call, e: elapsed, m: message, sc: call };
    this.log.push(logEntry);

    if (wonMatch) {
      return { event: 'gameWon', winner: this.winner, scores: [...this.scores], logEntry };
    }

    return { event: 'point', scores: [...this.scores], logEntry };
  }

  fault(elapsedSeconds = 0) {
    if (this.gameOver) {
      return { event: 'gameWon', winner: this.winner, scores: [...this.scores] };
    }

    this.history.push(this.saveSnapshot());
    this.redoStack = [];

    let event;
    let message;

    if (this.format === 'singles') {
      this.servingTeam = 1 - this.servingTeam;
      this.serverCourt = this.scores[this.servingTeam] % 2 === 0 ? 'right' : 'left';
      message = `Fault. Side out, ${this.teamNames[this.servingTeam]} serves`;
      event = 'sideOut';
    } else if (this.serverNumber === 1) {
      this.serverNumber = 2;
      this.serverCourt = this.serverCourt === 'right' ? 'left' : 'right';
      message = `Fault. Server 2 serves for ${this.teamNames[this.servingTeam]}`;
      event = 'secondServer';
    } else {
      this.servingTeam = 1 - this.servingTeam;
      this.serverNumber = 1;
      this.serverCourt = 'right';
      message = `Fault. Side out, ${this.teamNames[this.servingTeam]} serves`;
      event = 'sideOut';
    }

    const sScore = this.scores[this.servingTeam];
    const rScore = this.scores[1 - this.servingTeam];
    const srvNum = this.serverNumber ?? 1;
    const call = `${sScore}\u2013${rScore}\u2013${srvNum}`;
    const elapsed = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));
    const logEntry = { elapsed, message, call, e: elapsed, m: message, sc: call };
    this.log.push(logEntry);

    if (event === 'secondServer') {
      return { event: 'secondServer', serverNumber: 2, logEntry };
    }
    return { event: 'sideOut', servingTeam: this.servingTeam, serverNumber: 1, logEntry };
  }

  undo() {
    if (this.history.length === 0) return false;
    this.redoStack.push(this.saveSnapshot());
    const lastSnap = this.history.pop();
    this.restoreSnapshot(lastSnap);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    this.history.push(this.saveSnapshot());
    const nextSnap = this.redoStack.pop();
    this.restoreSnapshot(nextSnap);
    return true;
  }

  timeExpired(elapsedSeconds = 0) {
    if (this.gameOver) {
      return {
        event: 'gameOver',
        winner: this.winner,
        isDraw: this.winner === null && this.scores[0] === this.scores[1],
        scores: [...this.scores],
      };
    }

    this.history.push(this.saveSnapshot());
    this.redoStack = [];
    this.gameOver = true;

    const s0 = this.scores[0];
    const s1 = this.scores[1];
    let isDraw = false;

    if (s0 > s1) {
      this.winner = 0;
    } else if (s1 > s0) {
      this.winner = 1;
    } else {
      this.winner = null;
      isDraw = true;
    }

    const elapsed = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));
    const srvNum = this.serverNumber ?? 1;
    const call = `${this.scores[this.servingTeam]}\u2013${this.scores[1 - this.servingTeam]}\u2013${srvNum}`;
    const message = isDraw
      ? `⏰ Time expired. Match tied (${s0}\u2013${s1})`
      : `⏰ Time expired. 🏆 ${this.teamNames[this.winner]} won the match (${this.scores[this.winner]}\u2013${this.scores[1 - this.winner]})`;

    const logEntry = { elapsed, message, call, e: elapsed, m: message, sc: call };
    this.log.push(logEntry);

    return {
      event: isDraw ? 'draw' : 'gameWon',
      winner: this.winner,
      isDraw,
      scores: [...this.scores],
      logEntry,
    };
  }

  setFormat(format) {
    if (format !== 'doubles' && format !== 'singles') return;
    this.format = format;
    this.reset();
  }

  setTeamName(teamIdx, name) {
    if (teamIdx === 0 || teamIdx === 1) {
      this.teamNames[teamIdx] = name.trim() || (teamIdx === 0 ? 'Team Omega' : 'Team Alpha');
    }
  }

  setTeamPalette(teamIdx, paletteKey) {
    if ((teamIdx === 0 || teamIdx === 1) && paletteKey) {
      this.teamPalettes[teamIdx] = paletteKey;
    }
  }

  getState() {
    const serverScore = this.scores[this.servingTeam];
    const receiverScore = this.scores[1 - this.servingTeam];
    const team0Score = this.scores[0];
    const team1Score = this.scores[1];
    const srvNum = this.serverNumber ?? 1;

    return {
      format: this.format,
      scores: [...this.scores],
      team0Score,
      team1Score,
      team0Tens: Math.floor(team0Score / 10),
      team0Units: team0Score % 10,
      team1Tens: Math.floor(team1Score / 10),
      team1Units: team1Score % 10,
      teamKeys: [...this.teamKeys],
      teamNames: [...this.teamNames],
      teamPalettes: [...this.teamPalettes],
      servingPaletteKey: this.teamPalettes[this.servingTeam] || 'omega',
      servingTeam: this.servingTeam,
      servingTeamKey: this.teamKeys[this.servingTeam],
      receivingTeamKey: this.teamKeys[1 - this.servingTeam],
      servingTeamName: this.teamNames[this.servingTeam],
      receivingTeamName: this.teamNames[1 - this.servingTeam],
      serverNumber: this.serverNumber,
      serverCourt: this.serverCourt,
      serverScore,
      receiverScore,
      serverTens: Math.floor(serverScore / 10),
      serverUnits: serverScore % 10,
      receiverTens: Math.floor(receiverScore / 10),
      receiverUnits: receiverScore % 10,
      gameOver: this.gameOver,
      winner: this.winner,
      winnerName: this.winner !== null ? this.teamNames[this.winner] : null,
      isDraw: Boolean(this.gameOver && this.winner === null && this.scores[0] === this.scores[1]),
      canUndo: this.history.length > 0,
      canRedo: this.redoStack.length > 0,
      log: [...this.log],
      callout:
        this.format === 'doubles'
          ? `${serverScore} - ${receiverScore} - ${this.serverNumber}`
          : `${serverScore} - ${receiverScore}`,
      callCompact: `${serverScore}\u2013${receiverScore}\u2013${srvNum}`,
      liveAnnouncement: `${this.teamNames[this.servingTeam]} serving. ${serverScore}, ${receiverScore}, ${srvNum}.`,
    };
  }
}
