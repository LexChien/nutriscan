const Store = (() => {
  const KEY = "nutriscan.v1";
  const seed = {
    user: null,
    scans: [],
    compareIds: [],
    contacts: [],
    redeemUsed: []
  };

  function load() {
    try { return { ...seed, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return { ...seed }; }
  }
  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
  function get() { return load(); }
  function update(fn) {
    const data = load();
    fn(data);
    save(data);
    return data;
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return String(h);
  }

  function weekKey(d = new Date()) {
    const dt = new Date(d);
    const onejan = new Date(dt.getFullYear(), 0, 1);
    const week = Math.ceil((((dt - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${dt.getFullYear()}-W${week}`;
  }

  function planOf(user) {
    if (!user) return "guest";
    const now = Date.now();
    if (user.plan === "pro" || user.plan === "family") {
      if (user.planExpires && now > user.planExpires) return "free";
      return user.plan;
    }
    if (user.trialEnds && now < user.trialEnds) return "pro";
    return user.plan || "free";
  }

  function quota(user) {
    const plan = planOf(user);
    if (plan === "pro" || plan === "family") return { plan, limit: Infinity, used: 0, remain: Infinity };
    const data = load();
    const key = weekKey();
    const used = data.scans.filter(s => s.week === key && s.userId === (user?.email || "guest")).length;
    const limit = user ? 7 : 2;
    return { plan: user ? "free" : "guest", limit, used, remain: Math.max(0, limit - used) };
  }

  function canScan() {
    const q = quota(load().user);
    return q.remain > 0;
  }

  function register({ name, email, password, goal }) {
    const data = load();
    if (!email || !email.includes("@")) throw new Error("請輸入有效 Email");
    if (!password || password.length < 6) throw new Error("密碼至少 6 碼");
    if (data.user && data.user.email === email) throw new Error("此信箱已註冊，請直接登入");
    const user = {
      name: name || email.split("@")[0],
      email,
      pass: hash(password),
      goal: goal || "控糖",
      form: "solid",
      plan: "free",
      trialEnds: null,
      planExpires: null,
      createdAt: Date.now()
    };
    update(d => { d.user = user; });
    return user;
  }

  function login(email, password) {
    const data = load();
    if (!data.user || data.user.email !== email) throw new Error("找不到帳號，請先免費開始");
    if (data.user.pass !== hash(password)) throw new Error("密碼不正確");
    return data.user;
  }

  function startTrial() {
    update(d => {
      if (!d.user) throw new Error("請先建立帳號");
      if (d.user.trialUsed) throw new Error("試用已使用過");
      d.user.trialUsed = true;
      d.user.trialEnds = Date.now() + 7 * 24 * 3600 * 1000;
    });
  }

  function redeem(code) {
    const raw = String(code || "").trim().toUpperCase();
    const map = {
      "NUTRI-PRO-2026": { plan: "pro", days: 365 },
      "NUTRI-FAM-2026": { plan: "family", days: 365 },
      "NUTRI-MONTH": { plan: "pro", days: 30 }
    };
    if (!map[raw]) throw new Error("序號無效");
    update(d => {
      if (!d.user) throw new Error("請先登入");
      if ((d.redeemUsed || []).includes(raw)) throw new Error("此序號已使用");
      d.redeemUsed = d.redeemUsed || [];
      d.redeemUsed.push(raw);
      d.user.plan = map[raw].plan;
      d.user.planExpires = Date.now() + map[raw].days * 86400000;
    });
    return map[raw];
  }

  function addScan(scan) {
    const data = load();
    const user = data.user;
    const q = quota(user);
    if (q.remain <= 0) throw new Error("本週免費次數已用完，請升級 Pro");
    const row = {
      id: "s" + Date.now(),
      userId: user?.email || "guest",
      week: weekKey(),
      createdAt: Date.now(),
      ...scan
    };
    update(d => { d.scans.unshift(row); });
    return row;
  }

  function deleteScan(id) {
    update(d => { d.scans = d.scans.filter(s => s.id !== id); });
  }

  function setGoal(goal) {
    update(d => { if (d.user) d.user.goal = goal; });
  }

  return {
    get, update, load, planOf, quota, canScan,
    register, login, startTrial, redeem, addScan, deleteScan, setGoal, weekKey
  };
})();
