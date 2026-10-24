import sys
from pathlib import Path

from make_round3 import BASE, C, hand
from make_round4 import ring

OUT = Path(sys.argv[1])

G = {"body": "#8BD47E", "shade": "#6DBE63", "hi": "#B8EBAA", "leaf": "#5FB257", "leafdark": "#4A9A45",
     "pot": "#D9774B", "rim": "#E58C5F", "potdark": "#B85E36", "soil": "#6B4A3A", "ink": "#1B1530",
     "cheek": "#FF9F8A", "petal": "#FFB3C7", "center": "#FFD45C", "gold": "#FFC93C"}

LEAF = "M0,0 Q13,-11 28,-2 Q14,9 0,0 Z"

EYES = {
    "open": "<ellipse cx='87' cy='112' rx='5.5' ry='6.5' fill='{ink}'/><ellipse cx='113' cy='112' rx='5.5' ry='6.5' fill='{ink}'/>"
            "<circle cx='89' cy='109.5' r='1.8' fill='#fff'/><circle cx='115' cy='109.5' r='1.8' fill='#fff'/>",
    "happy": "<path d='M81,114 Q87,106 93,114 M107,114 Q113,106 119,114' stroke='{ink}' stroke-width='3.2' fill='none' stroke-linecap='round'/>",
    "closed": "<path d='M81,111 Q87,117 93,111 M107,111 Q113,117 119,111' stroke='{ink}' stroke-width='3' fill='none' stroke-linecap='round'/>",
    "kind": "<path d='M81,113 Q87,108 93,113 M107,113 Q113,108 119,113' stroke='{ink}' stroke-width='3' fill='none' stroke-linecap='round'/>",
    "focus": "<ellipse cx='87' cy='112' rx='5.5' ry='6.5' fill='{ink}'/><ellipse cx='113' cy='112' rx='5.5' ry='6.5' fill='{ink}'/>"
             "<circle cx='89' cy='109.5' r='1.8' fill='#fff'/><circle cx='115' cy='109.5' r='1.8' fill='#fff'/>"
             "<path d='M81,103 L92,104.5 M108,104.5 L119,103' stroke='{ink}' stroke-width='2.6' stroke-linecap='round'/>",
}
MOUTHS = {
    "smile": "<path d='M92,124 Q100,131 108,124' stroke='{ink}' stroke-width='3' fill='none' stroke-linecap='round'/>",
    "big": "<path d='M89,122 Q100,138 111,122 Z' fill='{ink}'/><path d='M94,129 Q100,134 106,129' fill='#FF8A80'/>",
    "soft": "<path d='M95,125 Q100,128 105,125' stroke='{ink}' stroke-width='2.8' fill='none' stroke-linecap='round'/>",
    "talk": "<ellipse class='talk' cx='100' cy='126' rx='5' ry='4' fill='{ink}'/>",
    "o": "<ellipse cx='100' cy='126' rx='3' ry='3.5' fill='{ink}'/>",
}

STATES = [
    ("idle", "Idle", "Menu, nothing happening", "Slow bob (4 px, 3 s), blinks every few seconds", "open", "smile", ""),
    ("watch", "Watching", "A pad is glowing", "Body still. Eyes slide toward the glowing pad", "open", "smile", "look"),
    ("happy", "Happy", "Good tap", "Quick squash and bounce, 200 ms", "happy", "smile", ""),
    ("cheer", "Cheer", "5 good taps in a row", "Jumps, leaf arms up, gold sparkles pop", "happy", "big", "sparkle"),
    ("encourage", "Encourage", "A miss", "Head tilt, one leaf gives a thumbs up. Never sad", "kind", "soft", ""),
    ("push", "Push", "Last 5 taps", "Determined brows, leaf arms pump twice", "focus", "smile", ""),
    ("listen", "Listening", "Companion is listening", "Leans in and nods slowly", "open", "soft", ""),
    ("speak", "Speaking", "Companion is speaking", "Mouth opens and closes, leaves sway", "open", "talk", ""),
    ("celebrate", "Celebrate", "Game done", "Flower blooms on top, happy sway, sparkles", "happy", "big", "sparkle"),
    ("comfort", "Comfort", "Mood 1 or 2", "Leaves hug the body, slow warm glow. No hopping", "closed", "soft", "glow"),
    ("think", "Thinking", "Mood question", "Leaf on chin, eyes look up", "open", "o", ""),
    ("sleepy", "Sleepy", "Board not connected", "Eyes closed, leaves droop, a floating z", "closed", "o", "zzz"),
]


def crown(leaves, flower):
    parts = [f"<path d='M100,80 Q97,68 100,56' stroke='{G['leafdark']}' stroke-width='4' fill='none' stroke-linecap='round'/>"]
    spots = [("translate(100 60) rotate(-150) scale(1.15)", G["leaf"]), ("translate(100 60) rotate(-30) scale(1.15)", G["leaf"]),
             ("translate(99 70) rotate(-165) scale(.85)", G["leafdark"]), ("translate(100 70) rotate(-15) scale(.85)", G["leafdark"])]
    for tf, color in spots[:leaves]:
        parts.append(f"<path class='head-leaf' d='{LEAF}' fill='{color}' transform='{tf}'/>")
    if flower:
        petals = "".join(f"<ellipse cx='100' cy='44' rx='6' ry='9' fill='{G['petal']}' transform='rotate({a} 100 52)'/>" for a in range(0, 360, 72))
        parts.append(f"<g class='flower'>{petals}<circle cx='100' cy='52' r='6' fill='{G['center']}'/></g>")
    return f"<g class='crown'>{''.join(parts)}</g>"


def ankur(state="idle", eyes="open", mouth="smile", extra="", leaves=4, flower=False, size=160):
    ink = G["ink"]
    fx = ""
    if "sparkle" in extra:
        stars = [(40, 60), (160, 52), (34, 120), (168, 112), (60, 30), (140, 26)]
        fx += "".join(f"<path class='spark' style='animation-delay:{i * 90}ms' d='M{x},{y - 7} L{x + 2},{y - 2} L{x + 7},{y} L{x + 2},{y + 2} L{x},{y + 7} L{x - 2},{y + 2} L{x - 7},{y} L{x - 2},{y - 2} Z' fill='{G['gold']}'/>"
                      for i, (x, y) in enumerate(stars))
    if "zzz" in extra:
        fx += f"<text class='z' x='138' y='70' font-size='22' font-weight='700' fill='{C['mu']}'>z</text>"
    glow = f"<circle class='glow' cx='100' cy='120' r='62' fill='{G['gold']}' opacity='.18'/>" if "glow" in extra else ""
    face = EYES[eyes].format(ink=ink) + MOUTHS[mouth].format(ink=ink)
    if "look" in extra:
        face = f"<g class='look'>{face}</g>"
    return f"""<svg viewBox='20 10 160 210' width='{size}' class='ankur st-{state}' role='img' aria-label='Ankur {state}'>
{glow}<ellipse cx='100' cy='213' rx='46' ry='6' fill='#1B1530' opacity='.08'/>
<g class='plant'>
  <g class='arm arm-l'><path d='{LEAF}' fill='{G['leaf']}' transform='translate(64 128) scale(-1 1)'/></g>
  <g class='arm arm-r'><path d='{LEAF}' fill='{G['leaf']}' transform='translate(136 128)'/></g>
  {crown(leaves, flower)}
  <ellipse cx='100' cy='120' rx='38' ry='41' fill='{G['body']}'/>
  <path d='M64,128 Q100,170 136,128 Q132,160 100,161 Q68,160 64,128 Z' fill='{G['shade']}' opacity='.7'/>
  <ellipse cx='84' cy='96' rx='9' ry='6' fill='{G['hi']}' opacity='.8' transform='rotate(-25 84 96)'/>
  <ellipse cx='78' cy='124' rx='6' ry='4' fill='{G['cheek']}' opacity='.75'/><ellipse cx='122' cy='124' rx='6' ry='4' fill='{G['cheek']}' opacity='.75'/>
  <g class='face'>{face}</g>
</g>
<path d='M60,160 L140,160 L131,206 Q100,214 69,206 Z' fill='{G['pot']}'/>
<rect x='54' y='150' width='92' height='16' rx='7' fill='{G['rim']}'/>
<ellipse cx='100' cy='151' rx='40' ry='4' fill='{G['soil']}'/>
<path d='M70,182 Q100,190 130,182' stroke='#fff' stroke-width='3' fill='none' stroke-dasharray='2 7' stroke-linecap='round' opacity='.75'/>
<path d='M66,170 L134,170' stroke='{G['potdark']}' stroke-width='2' opacity='.35'/>
{fx}</svg>"""


CSS = """
.ankur{overflow:visible}
.plant,.arm,.crown,.face,.look,.flower,.spark,.glow,.talk,.z{transform-box:fill-box}
.plant{transform-origin:50% 100%}
.arm-l{transform-origin:100% 50%} .arm-r{transform-origin:0% 50%}
.crown{transform-origin:50% 100%}
@keyframes bob{50%{transform:translateY(-4px)}}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
@keyframes look{0%,15%{transform:translateX(0)}35%,85%{transform:translateX(5px) translateY(-2px)}100%{transform:translateX(0)}}
@keyframes hop{0%,100%{transform:translateY(0) scale(1)}25%{transform:translateY(0) scale(1.08,.9)}55%{transform:translateY(-10px) scale(.95,1.06)}80%{transform:translateY(0) scale(1.04,.96)}}
@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-22px)}60%{transform:translateY(-22px)}}
@keyframes armsup-l{0%,100%{transform:rotate(0)}40%,60%{transform:rotate(55deg)}}
@keyframes armsup-r{0%,100%{transform:rotate(0)}40%,60%{transform:rotate(-55deg)}}
@keyframes spark{0%,100%{transform:scale(0);opacity:0}40%,70%{transform:scale(1);opacity:1}}
@keyframes tilt{0%,100%{transform:rotate(0)}30%,80%{transform:rotate(-7deg)}}
@keyframes thumb{0%,100%{transform:rotate(0)}30%,80%{transform:rotate(-70deg)}}
@keyframes pump{0%,100%{transform:rotate(0)}25%,75%{transform:rotate(-40deg)}50%{transform:rotate(10deg)}}
@keyframes pumpl{0%,100%{transform:rotate(0)}25%,75%{transform:rotate(40deg)}50%{transform:rotate(-10deg)}}
@keyframes lean{0%,100%{transform:rotate(0)}50%{transform:rotate(5deg) translateY(2px)}}
@keyframes talk{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1.2)}}
@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes bloom{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes hug-l{0%,100%{transform:rotate(-35deg)}50%{transform:rotate(-45deg)}}
@keyframes hug-r{0%,100%{transform:rotate(35deg)}50%{transform:rotate(45deg)}}
@keyframes glow{0%,100%{transform:scale(.92);opacity:.12}50%{transform:scale(1.05);opacity:.28}}
@keyframes droop{0%,100%{transform:rotate(18deg) scaleY(.9)}50%{transform:rotate(22deg) scaleY(.86)}}
@keyframes z{0%{transform:translate(0,0);opacity:0}30%{opacity:1}100%{transform:translate(10px,-24px);opacity:0}}
@keyframes chin{0%,100%{transform:rotate(-70deg)}50%{transform:rotate(-78deg)}}
.st-idle .plant{animation:bob 3s ease-in-out infinite} .face{transform-origin:50% 50%}
.st-idle .face,.st-watch .face,.st-listen .face,.st-speak .face{animation:blink 5s infinite}
.st-watch .look{animation:look 3s ease-in-out infinite}
.st-happy .plant{animation:hop 1.4s ease-out infinite}
.st-cheer .plant{animation:jump 1.6s cubic-bezier(.3,.7,.4,1) infinite}
.st-cheer .arm-l,.st-celebrate .arm-l{animation:armsup-l 1.6s ease-in-out infinite} .st-cheer .arm-r,.st-celebrate .arm-r{animation:armsup-r 1.6s ease-in-out infinite}
.spark{transform-origin:50% 50%;animation:spark 1.6s ease-out infinite}
.st-encourage .plant{animation:tilt 2.4s ease-in-out infinite} .st-encourage .arm-r{animation:thumb 2.4s ease-in-out infinite}
.st-push .arm-r{animation:pump .9s ease-in-out infinite} .st-push .arm-l{animation:pumpl .9s ease-in-out infinite}
.st-listen .plant{animation:lean 2.6s ease-in-out infinite}
.st-speak .talk{transform-origin:50% 50%;animation:talk .35s ease-in-out infinite} .st-speak .crown{animation:sway 2s ease-in-out infinite}
.st-celebrate .plant{animation:sway 1.2s ease-in-out infinite} .st-celebrate .flower{transform-origin:50% 100%;animation:bloom 1s ease-out both}
.st-comfort .arm-l{animation:hug-l 3s ease-in-out infinite} .st-comfort .arm-r{animation:hug-r 3s ease-in-out infinite}
.st-comfort .plant{animation:sway 4s ease-in-out infinite} .glow{transform-origin:50% 50%;animation:glow 3s ease-in-out infinite}
.st-think .arm-r{animation:chin 2.6s ease-in-out infinite}
.st-sleepy .crown,.st-sleepy .arm-r{animation:droop 4s ease-in-out infinite} .st-sleepy .arm-l{transform:rotate(-18deg)}
.z{animation:z 2.4s ease-out infinite}
@media (prefers-reduced-motion:reduce){.ankur *{animation:none!important}}
"""

PAGE_CSS = """
body{width:auto;height:auto;overflow:visible;display:block;padding:40px 48px 60px;max-width:1280px;margin:0 auto}
h1{font-size:40px} h2{font-size:24px;margin:44px 0 6px} .lead{color:var(--mu);max-width:720px;margin-top:8px}
.hero{display:grid;grid-template-columns:300px 1fr;gap:36px;align-items:center;background:var(--sf);border-radius:32px;padding:32px;box-shadow:var(--sh);margin-top:24px}
.hero .stage{background:linear-gradient(180deg,#F3F0FA,#E9F7E5);border-radius:28px;display:grid;place-items:center;padding:20px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px} .chip{display:flex;align-items:center;gap:8px;font-size:13px;padding:6px 12px 6px 6px;border-radius:99px;background:var(--bg)}
.chip i{width:22px;height:22px;border-radius:50%}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px} .facts div{background:var(--bg);border-radius:18px;padding:14px} .facts b{display:block}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px}
.state{background:var(--sf);border-radius:24px;padding:16px 18px 18px;box-shadow:var(--sh)}
.state .pic{height:190px;display:grid;place-items:center;background:var(--bg);border-radius:18px;position:relative}
.state h3{font-size:17px;margin-top:12px} .state .when{font-size:13px;color:var(--ac);font-weight:700;margin-top:2px} .state p{font-size:13px;color:var(--mu);margin-top:4px;line-height:1.4}
.tag{position:absolute;top:10px;left:10px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;background:var(--mint);color:#1F6B47}
.pad{position:absolute;right:16px;top:58px;width:26px;height:26px;border-radius:50%;background:var(--ac);box-shadow:0 0 0 8px rgba(107,78,246,.2)}
.mock{margin-top:16px;background:var(--bg);border-radius:32px;border:1px solid var(--ln);overflow:hidden}
.mock .bar{display:flex;align-items:center;gap:12px;padding:22px 32px}
.mock main{display:grid;grid-template-columns:1fr 520px 1fr;align-items:center;gap:20px;padding:0 32px 32px}
.mock .left{display:flex;flex-direction:column;gap:6px}
.mock .speech{display:flex;align-items:flex-start;margin-top:34px}
.think{position:relative;isolation:isolate;margin:-20px 0 0 4px;background:var(--sf);border-radius:40px;padding:16px 24px;
  filter:drop-shadow(0 10px 16px rgba(27,21,48,.10));font-weight:700;font-size:16px;max-width:230px;display:grid;
  transform-origin:0% 100%;animation:pop .5s cubic-bezier(.3,1.6,.5,1) both}
/* puffs around the edge turn the rounded box into a cloud */
.think .puff{position:absolute;z-index:-1;background:var(--sf);border-radius:50%}
.puff.p1{width:54px;height:54px;top:-22px;left:6%} .puff.p2{width:66px;height:66px;top:-30px;left:34%}
.puff.p3{width:50px;height:50px;top:-18px;right:6%} .puff.p4{width:46px;height:46px;bottom:-16px;left:22%}
.puff.p5{width:52px;height:52px;bottom:-20px;right:18%} .puff.p6{width:42px;height:42px;left:-16px;top:22%}
.puff.p7{width:42px;height:42px;right:-16px;top:26%}
.think>.dots,.think>.line{grid-area:1/1;align-self:center}
.think em{position:absolute;background:var(--sf);border-radius:50%}
.think .t1{width:18px;height:18px;left:-6px;bottom:-26px} .think .t2{width:10px;height:10px;left:-20px;bottom:-40px}
.dots{display:flex;gap:5px;padding:4px 0} .dots i{width:8px;height:8px;border-radius:50%;background:var(--mu);opacity:.5;animation:dot 1s ease-in-out infinite}
.dots i:nth-child(2){animation-delay:.15s} .dots i:nth-child(3){animation-delay:.3s}
.loop .dots{animation:dots-vis 4s infinite} .loop .line{animation:line-vis 4s infinite}
@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes dot{0%,100%{transform:translateY(0);opacity:.35}50%{transform:translateY(-4px);opacity:.9}}
@keyframes dots-vis{0%,28%{opacity:1}34%,100%{opacity:0}}
@keyframes line-vis{0%,30%{opacity:0;transform:scale(.9)}38%,100%{opacity:1;transform:scale(1)}}
.bubbles{display:flex;gap:28px;flex-wrap:wrap;margin-top:16px;align-items:flex-start}
.bubbles .speech{display:flex;align-items:flex-start;background:var(--bg);border:1px solid var(--ln);border-radius:24px;padding:64px 36px 18px}
.count{font:700 80px/1 'Jakarta';letter-spacing:-.04em} .count small{font-size:26px;color:var(--mu);font-weight:500}
.stat{border-radius:22px;padding:16px 18px} .stat .big{font-size:32px}
.right{display:flex;flex-direction:column;gap:12px}
.ring{position:relative} .ring>svg{position:absolute;inset:0} .ring .inner{position:absolute;inset:0;display:grid;place-items:center}
.rules{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
.rules div{background:var(--sf);border-radius:22px;padding:18px;box-shadow:var(--sh)} .rules b{display:block;margin-bottom:4px}
.rules p{font-size:14px;color:var(--mu)}
"""


def thought(line, loop=True):
    """Thought bubble: thinking dots first, then the coach line pops in."""
    dots = "<span class='dots'><i></i><i></i><i></i></span>"
    puffs = "".join(f"<span class='puff p{i}'></span>" for i in range(1, 8))
    return (f"<div class='think{' loop' if loop else ''}'>{puffs}{dots}<span class='line'>{line}</span>"
            "<em class='t1'></em><em class='t2'></em></div>")


def state_card(sid, name, when, motion, eyes, mouth, extra):
    flower = sid == "celebrate"
    pad = "<span class='pad' title='glowing pad'></span>" if sid == "watch" else ""
    return (f"<div class='state'><div class='pic'>{pad}{ankur(sid, eyes, mouth, extra, flower=flower, size=150)}</div>"
            f"<h3>{name}</h3><div class='when'>{when}</div><p>{motion}</p></div>")


def page():
    states = "".join(state_card(*s) for s in STATES)
    palette = "".join(f"<span class='chip'><i style='background:{G[k]}'></i>{label} {G[k]}</span>"
                      for k, label in [("body", "Body"), ("leaf", "Leaf"), ("pot", "Clay pot"), ("cheek", "Cheeks"), ("petal", "Petal"), ("gold", "Sparkle")])
    game = f"""
<div class='mock'><div class='bar'><span class='logo'>rehabit<i></i></span><span class='pill'><b>Classic</b> · Right hand</span><span class='pill' style='margin-left:auto'>Stop</span></div>
<main><div class='left'><span style='color:var(--mu)'>Good taps</span><span class='count num'>7<small> / 20</small></span>
<div class='speech'>{ankur('cheer', 'happy', 'big', 'sparkle', size=150)}{thought('Bahut badhiya!')}</div></div>
{ring(7, hand(300), size=520)}
<div class='right'><div class='stat' style='background:var(--mint)'><span class='k'>This tap</span><span class='big num'>386<small>ms</small></span></div>
<div class='stat' style='background:var(--peach)'><span class='k'>In a row</span><span class='big num'>5</span></div>
<div class='stat' style='background:var(--lilac)'><span class='k'>Misses</span><span class='big num'>0</span></div></div></main></div>"""
    return f"""<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Ankur design sheet</title>
<style>{BASE}{PAGE_CSS}{CSS}.pill{{font-size:14px;padding:8px 14px;border-radius:99px;background:var(--sf);border:1px solid var(--ln)}}</style></head><body>
<h1>Ankur, our little sprout</h1>
<p class='lead'>Recovery is a habit, and habits grow. Ankur lives in a small clay pot with a full crown of leaves. He cheers between taps, stays calm while a coin glows, blooms when a game is done, and never looks sad.</p>
<section class='hero'><div class='stage'>{ankur('idle', 'open', 'smile', '', size=230)}</div>
<div><h2 style='margin:0'>Character</h2><p class='lead'>A chubby round sprout with two leaf arms and a leaf crown. Big kind eyes, peach cheeks, a terracotta pot with a white dotted rangoli band. Warm and gentle for adults, not a kids' cartoon.</p>
<div class='chips'>{palette}</div>
<div class='facts'><div><b>Name</b><span class='k'>Ankur means sprout</span></div><div><b>Voice</b><span class='k'>The coach lines, Hinglish</span></div><div><b>Sizes</b><span class='k'>150 game · 96 menu · 72 cards</span></div></div></div></section>
<h2>States</h2><p class='lead'>Each state is driven by events the app already has. All motions are CSS on a single SVG, and all stop when the device asks for reduced motion.</p>
<div class='grid'>{states}</div>
<h2>In the game</h2><p class='lead'>Ankur takes the coach bubble's place in the left column, far from the hand, so he never covers the glowing coin.</p>
{game}
<h2>Thought bubble</h2><p class='lead'>Ankur's lines sit in a soft cloud bubble that trails down to his head. It shows thinking dots for a moment, then the line pops in. The voice clip plays at the same time as the line.</p>
<div class='bubbles'>
<div class='speech'>{ankur('cheer', 'happy', 'big', 'sparkle', size=130)}{thought('Bahut badhiya! Aise hi karte raho.')}</div>
<div class='speech'>{ankur('encourage', 'kind', 'soft', '', size=130)}{thought('Koi baat nahi, agla try karo.')}</div>
<div class='speech'>{ankur('push', 'focus', 'smile', '', size=130)}{thought('Bas 5 aur! Aap kar sakte ho.')}</div>
</div>
<h2>Rules</h2>
<div class='rules'><div><b>Calm while a coin glows</b><p>Big moves only between targets, so reaction time stays fair. While a coin glows he only glances at it.</p></div>
<div><b>Never sad, never scolds</b><p>A miss gets a tilt and a thumbs up. A low mood gets a hug and a warm glow, never a hop.</p></div>
<div><b>Gentle motion</b><p>200 to 800 ms moves, no flashing, small sizes. Everything stops with reduced motion.</p></div></div>
</body></html>"""


(OUT / "ankur-sheet.html").write_text(page(), encoding="utf-8")
