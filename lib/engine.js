export class PickleballEngine {
  constructor(options = {}) {
    this.format = options.format || 'doubles'; // 'doubles' | 'singles'
    this.targetScore = options.targetScore || 11;
    this.winBy = options.winBy || 2;
    this.teamNames = options.teamNames || ['TEAM ALPHA', 'TEAM OMEGA'];
    this.playerNames = options.playerNames || {
      team0: ['Player 1', 'Player 2'],
      team1: ['Player 3', 'Player 4']
    };
    this.reset();
  }

  reset() {
    this.scores = [0, 0];
    this.servingTeam = 0; // 0 or 1
    // Doubles starts with Server 2 by official rule (0-0-2), but can be configured or toggled
    this.serverNumber = this.format === 'doubles' ? 2 : null;
    this.serverCourt = 'right'; // 'right' or 'left'
    this.courtPositions = [
      { left: this.playerNames.team0[1], right: this.playerNames.team0[0] },
      { left: this.playerNames.team1[1], right: this.playerNames.team1[0] }
    ];
    this.gameOver = false;
    this.winner = null;
    this.history = [];
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
      winner: this.winner
    });
  }

  restoreSnapshot(jsonStr) {
    const snap = JSON.parse(jsonStr);
    this.format = snap.format;
    this.scores = snap.scores;
    this.servingTeam = snap.servingTeam;
    this.serverNumber = snap.serverNumber;
    this.courtPositions = snap.courtPositions;
    this.serverCourt = snap.serverCourt;
    this.gameOver = snap.gameOver;
    this.winner = snap.winner;
  }

  pointWon() {
    if (this.gameOver) return { event: 'gameOver', winner: this.winner };

    this.history.push(this.saveSnapshot());
    this.scores[this.servingTeam]++;

    const sScore = this.scores[this.servingTeam];
    const rScore = this.scores[1 - this.servingTeam];

    if (sScore >= this.targetScore && (sScore - rScore) >= this.winBy) {
      this.gameOver = true;
      this.winner = this.servingTeam;
      return { event: 'gameWon', winner: this.winner, scores: [...this.scores] };
    }

    if (this.format === 'doubles') {
      const current = this.courtPositions[this.servingTeam];
      this.courtPositions[this.servingTeam] = { left: current.right, right: current.left };
      this.serverCourt = this.serverCourt === 'right' ? 'left' : 'right';
    } else {
      this.serverCourt = (this.scores[this.servingTeam] % 2 === 0) ? 'right' : 'left';
    }

    return { event: 'point', scores: [...this.scores] };
  }

  fault() {
    if (this.gameOver) return { event: 'gameOver', winner: this.winner };

    this.history.push(this.saveSnapshot());

    if (this.format === 'singles') {
      this.servingTeam = 1 - this.servingTeam;
      this.serverCourt = (this.scores[this.servingTeam] % 2 === 0) ? 'right' : 'left';
      return { event: 'sideOut', servingTeam: this.servingTeam };
    }

    if (this.serverNumber === 1) {
      this.serverNumber = 2;
      this.serverCourt = this.serverCourt === 'right' ? 'left' : 'right';
      return { event: 'secondServer', serverNumber: 2 };
    } else {
      this.servingTeam = 1 - this.servingTeam;
      this.serverNumber = 1;
      this.serverCourt = 'right';
      return { event: 'sideOut', servingTeam: this.servingTeam };
    }
  }

  undo() {
    if (this.history.length === 0) return false;
    const lastSnap = this.history.pop();
    this.restoreSnapshot(lastSnap);
    return true;
  }

  setFormat(format) {
    if (format !== 'doubles' && format !== 'singles') return;
    this.format = format;
    this.reset();
  }

  setTeamName(teamIdx, name) {
    if (teamIdx === 0 || teamIdx === 1) {
      this.teamNames[teamIdx] = name.trim() || `TEAM ${teamIdx === 0 ? 'ALPHA' : 'OMEGA'}`;
    }
  }

  getState() {
    const serverScore = this.scores[this.servingTeam];
    const receiverScore = this.scores[1 - this.servingTeam];

    return {
      format: this.format,
      scores: [...this.scores],
      servingTeam: this.servingTeam,
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
      canUndo: this.history.length > 0,
      callout: this.format === 'doubles'
        ? `${serverScore} - ${receiverScore} - ${this.serverNumber}`
        : `${serverScore} - ${receiverScore}`
    };
  }
}
