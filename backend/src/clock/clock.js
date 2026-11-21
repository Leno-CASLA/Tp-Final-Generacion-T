export class SystemClock {
  constructor(timeZone = 'America/Argentina/Buenos_Aires') {
    this.timeZone = timeZone;
  }

  now() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const get = (type) => parts.find((p) => p.type === type)?.value || '00';
    return new Date(
      `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`
    );
  }
}

export class FakeClock {
  constructor(initialIsoString) {
    this.current = new Date(initialIsoString);
  }

  now() {
    return new Date(this.current.getTime());
  }

  set(isoString) {
    this.current = new Date(isoString);
  }

  advanceHours(hours) {
    this.current = new Date(this.current.getTime() + hours * 60 * 60 * 1000);
  }
}