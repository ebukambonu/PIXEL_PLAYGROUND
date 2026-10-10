export const WORDS =
  "APPLE BEACH BRAIN BREAD BRICK BRUSH CHAIR CHARM CHASE CHESS CHILL CLEAN CLOUD COAST CORAL CRANE CREAM DANCE DREAM DRINK EARTH FLAME FLASH FLOAT FOCUS FRESH FROST FRUIT GHOST GIANT GLASS GLOBE GRACE GRAPE GRASS GREEN HAPPY HEART HONEY HORSE HOUSE JUICE KNIFE LEMON LIGHT LUCKY MAGIC MAPLE METAL MIGHT MONEY MONTH MOUSE MOVIE MUSIC NIGHT OCEAN OLIVE PAINT PAPER PARTY PEACH PEARL PIANO PILOT PIZZA PLACE PLANT PLATE POINT POWER PRIDE QUEEN QUICK QUIET RADIO RAINY REACH RIVER ROBOT ROUND ROYAL SCALE SCORE SHAPE SHARE SHARK SHEEP SHINE SHIRT SHORE SKILL SLEEP SLICE SMALL SMILE SMOKE SNAKE SOLAR SPACE SPARK SPEED SPICE SPORT STACK STAGE STAND STARS STEAM STONE STORM STORY SUGAR SUNNY SWEET TABLE TIGER TOAST TODAY TOKEN TOWER TRACK TRAIN TREES TREND TRUST ULTRA VIDEO WATER WHEAT WHITE WORLD WRITE YOUTH ZEBRA ABOUT ABOVE ACUTE ADIEU ADULT AFTER AGAIN AGENT AGILE ALARM ALERT ALIEN ALIVE ALONE ALONG AMONG ANGEL ANGRY APART ARGUE AROMA ASIDE ASSET AUDIO AVOID AWAKE AWARD AWARE BADGE BASIC BEGIN BEING BELOW BENCH BLACK BLAME BLEND BLIND BLOCK BLOOM BOARD BONUS BOUND BREAK BRIEF BROAD BROWN BUILD CABLE CANDY CARRY CATCH CAUSE CHAIN CHEAP CHECK CHIEF CHILD CHOSE CLAIM CLASS CLEAR CLIMB CLOSE CLOTH COUNT COURT COVER CRAFT CRASH CRAWL CRAZY CRISP CROSS CROWD CROWN DAILY DEBUT DELAY DEPTH DOUBT DOZEN DRAFT DRAIN DRESS DRIVE EAGER EARLY EIGHT ELBOW ELDER EMPTY ENJOY ENTER ENTRY EQUAL ERROR EVENT EVERY EXACT EXIST EXTRA FAITH FALSE FAULT FAVOR FEAST FENCE FIELD FIFTH FIFTY FIGHT FINAL FIRST FIXED FLOOR FLUID FLYER FORCE FORTH FORTY FRAME FRONT FUNNY GAMES GIVEN GLOVE GOING GRAND GREAT GROUP GUARD GUESS GUIDE HABIT HANDY HEAVY HELLO HOBBY HOTEL HUMAN HURRY IDEAL IMAGE INDEX INNER INPUT ISSUE JELLY JOINT JOKER JUDGE KAYAK KNOWN LABEL LARGE LASER LATER LAUGH LAYER LEARN LEAST LEAVE LEGAL LEVEL LIMIT LOCAL LOGIC LOOSE LOVER LOWER LUNAR LUNCH MANGO MARCH MATCH MAYBE MEDAL MERCY MERRY MINOR MODEL MOTOR MOUNT MOUTH MOVES NAIVE NEVER NOBLE NOISE NORTH NOVEL NURSE OFFER OFTEN ORDER OTHER OUTER OWNER PANEL PATCH PAUSE PEACE PENNY PHASE PHONE PHOTO PIECE PITCH PIXEL PLAIN PLANE PLANS PLUCK POKER POPPY PRESS PRICE PRIME PRINT PRIZE PROOF PROUD PULSE PUNCH QUEST RAISE RANGE RAPID RATIO READY RELAX REPLY RESET RIDER RIGHT RIVAL ROAST ROUGH ROUTE RURAL SALAD SAUCE SAVED SCENE SCENT SCOPE SCOUT SEEDS SENSE SERVE SEVEN SHADE SHAKE SHELL SHIFT SHOCK SHOOT SHORT SHOWN SIGHT SILLY SINCE SIXTH SLIDE SLOPE SMART SOLID SOLVE SOUND SOUTH SPARE SPEAK SPELL SPEND SPENT SPOON STAFF START STATE STEEL STICK STILL STOCK STORE STRAW STRIP STUCK STUDY STYLE SUPER SWING TAKEN TASTE TEACH THANK THEIR THERE THESE THICK THING THINK THIRD THOSE THREE THROW TIGHT TIMER TIRED TITLE TOTAL TOUCH TOUGH TRADE TRAIL TREAT TRICK TROOP TRULY TRUNK TWICE TWIST UNDER UNION UNITE UNTIL UPPER USAGE USUAL VALID VALUE VISIT VITAL VOICE VOTER WASTE WATCH WEARY WEIRD WHALE WHEEL WHERE WHICH WHILE WHOLE WOMAN WORRY WORSE WORST WORTH WOULD WRONG YACHT YIELD YOUNG".split(
    " ",
  );
export function dailyWord(date = new Date()) {
  const day = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86400000,
  );
  return WORDS[(day * 37 + 113) % WORDS.length];
}
export function wordColors(guess, answer) {
  const out = Array(5).fill("absent"),
    left = answer.split("");
  for (let i = 0; i < 5; i++)
    if (guess[i] === answer[i]) {
      out[i] = "correct";
      left[i] = null;
    }
  for (let i = 0; i < 5; i++)
    if (out[i] !== "correct") {
      const j = left.indexOf(guess[i]);
      if (j !== -1) {
        out[i] = "present";
        left[j] = null;
      }
    }
  return out;
}
export function slide2048(board, direction) {
  let grid = board.map((r) => [...r]),
    score = 0;
  const reverse = direction === "right" || direction === "down";
  for (let i = 0; i < 4; i++) {
    let row =
      direction === "left" || direction === "right"
        ? [...grid[i]]
        : grid.map((r) => r[i]);
    if (reverse) row.reverse();
    const nums = row.filter(Boolean),
      merged = [];
    for (let j = 0; j < nums.length; j++) {
      if (nums[j] === nums[j + 1]) {
        merged.push(nums[j] * 2);
        score += nums[j] * 2;
        j++;
      } else merged.push(nums[j]);
    }
    while (merged.length < 4) merged.push(0);
    if (reverse) merged.reverse();
    if (direction === "left" || direction === "right") grid[i] = merged;
    else grid.forEach((r, j) => (r[i] = merged[j]));
  }
  return {
    board: grid,
    score,
    changed: JSON.stringify(grid) !== JSON.stringify(board),
  };
}
export function has2048Moves(board) {
  return board.some((row, r) =>
    row.some(
      (v, c) =>
        !v || (c < 3 && v === row[c + 1]) || (r < 3 && v === board[r + 1][c]),
    ),
  );
}
export function winner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines)
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return board[a];
  return board.every(Boolean) ? "draw" : null;
}
export function connectWinner(board) {
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 7; c++)
      if (board[r][c])
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1],
        ])
          if (
            [1, 2, 3].every(
              (k) => board[r + k * dr]?.[c + k * dc] === board[r][c],
            )
          )
            return board[r][c];
  return board.flat().every(Boolean) ? "draw" : null;
}
