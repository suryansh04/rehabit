# Rehabit design notes

## Users and main actions

- Patient (stroke survivor, often older): press Start session, play a game on the board, hold the palm to talk, tap the mood.
- Therapist: read progress per mode, mood vs reaction time, session history; press Call now.

## Style (chosen in round 2)

**Soft Bento**: lavender base `#F3F0FA`, white surfaces, violet accent `#6B4EF6`, mint `#DDF5E8` and peach `#FFE7D9` tiles, ink `#1B1530`, muted `#5F5979`.
Font: Plus Jakarta Sans 500 / 700. Pill buttons, 28px card corners, soft shadow.

## Hand drawing

A right hand seen from above, so the thumb is on the left. The middle finger is the longest, the fingers fan out, and the thumb sits low on the palm. The coins are on the fingertip pads and in the palm center. The left hand is the mirror image.
The source is `scratchpad/hand.py` for now. It becomes `frontend/src/shared/HandBoard.tsx`.

## Layout (chosen in round 3)

- Play is full screen, with no sidebar. The flow is 1 Menu (game list plus board with an empty ring), 2 Game (a 20-tick ring around the hand, the counter, the coach bubble and live stats), 3 Talk (palm coin lit, chat, voice wave), 4 Mood (fingertip coins 1 to 5 are the scale), 5 Done (full ring, Shabash, Play again).
- Dashboard: Bento with a sidebar (Overview, Sessions, Games, Mood, Calls, Settings).
- Mockups: `round-04-play/`.

## Open

- Hindi on the Play screen: not decided. The coach and chat lines are already Hinglish.
