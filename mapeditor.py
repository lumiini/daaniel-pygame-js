import pygame
import os
import time
import tkinter as tk
from tkinter import filedialog

# Map tile codes and their corresponding sprite filenames
TILE_TYPES = {
    '0': ("Grass", "Sprites/Map/Grass.png"),
    '1': ("Tree", "Sprites/Map/Tree.png"),
    '2': ("Rock", "Sprites/Map/Rock.png"),
    '3': ("Water1", "Sprites/Map/Water1.png"),
    '4': ("Water2", "Sprites/Map/Water2.png"),
    '5': ("Sand", "Sprites/Map/Sand.png"),
    '6': ("AppleTree", "Sprites/Map/AppleTree.png"),
    '8': ("Wood_wall", "Sprites/Map/Wood_wall.png"),
    's': ("Sapling", "Sprites/Map/sapling.png"),
}

TILE_KEYS = list(TILE_TYPES.keys())
TILE_SIZE = 32
BAR_WIDTH = 64
BAR_PADDING = 8

# Load sprites
pygame.init()
screen = pygame.display.set_mode((TILE_SIZE * 41 + BAR_WIDTH, TILE_SIZE * 34 + 80), pygame.RESIZABLE)
pygame.display.set_caption("Map Editor")
font = pygame.font.Font(None, 28)
sprites = {}
for code, (_, path) in TILE_TYPES.items():
    sprites[code] = pygame.image.load(path).convert()
    sprites[code] = pygame.transform.scale(sprites[code], (TILE_SIZE, TILE_SIZE))

# Load or create map
def load_map(filename):
    if not os.path.exists(filename):
        # If usermap.txt does not exist, copy from usermaptemplate.txt
        if os.path.exists("usermaptemplate.txt"):
            with open("usermaptemplate.txt") as tf, open(filename, "w") as outf:
                for line in tf:
                    outf.write(line)
    if os.path.exists(filename):
        with open(filename) as f:
            lines = [line.rstrip('\n') for line in f]
        if lines:
            width = max(len(line) for line in lines)
            height = len(lines)
            # Pad all lines to width with '0'
            padded = [list(line.ljust(width, '0')) for line in lines]
            return padded, width, height
    # fallback default
    width, height = 41, 34
    return [["0" for _ in range(width)] for _ in range(height)], width, height

def save_map(filename, mapdata):
    with open(filename, "w") as f:
        for i, row in enumerate(mapdata):
            # Only write up to the last row, no extra blank line
            line = "".join(row)
            if i < len(mapdata) - 1:
                f.write(line + "\n")
            else:
                f.write(line)

def show_feedback(msg):
    global feedback_message, feedback_time
    feedback_message = msg
    feedback_time = time.time()

# Dynamically set map size based on usermap.txt
mapfile = "usermap.txt"
mapdata, MAP_W, MAP_H = load_map(mapfile)
selected = 0  # Index in TILE_KEYS

def clear_map():
    for y in range(MAP_H):
        for x in range(MAP_W):
            mapdata[y][x] = '0'
    show_feedback("Cleared!")

# Top bar button definitions
TOP_BAR_HEIGHT = 40
BUTTON_WIDTH = 120
BUTTON_HEIGHT = 32
BUTTON_PADDING = 16
BUTTON_WIDTHS = [100, 120, 100, 100, 100, 220]  # Custom widths for each button
buttons = [
    {"label": "Save", "action": "save"},
    {"label": "Save As", "action": "saveas"},
    {"label": "Load", "action": "load"},
    {"label": "Clear", "action": "clear"},
    {"label": "Exit", "action": "exit"},
    {"label": "Generate random world", "action": "generate"},
]

def draw_top_bar():
    pygame.draw.rect(screen, (180, 180, 200), (0, 0, screen.get_width(), TOP_BAR_HEIGHT))
    bx = BUTTON_PADDING
    for i, btn in enumerate(buttons):
        width = BUTTON_WIDTHS[i] if i < len(BUTTON_WIDTHS) else BUTTON_WIDTH
        rect = pygame.Rect(bx, 4, width, BUTTON_HEIGHT)
        # Highlight if this button is currently active (for all action buttons)
        if btn.get('active', False):
            pygame.draw.rect(screen, (255, 230, 120), rect)
        else:
            pygame.draw.rect(screen, (220, 220, 240), rect)
        pygame.draw.rect(screen, (100, 100, 120), rect, 2)
        label = font.render(btn["label"], True, (0, 0, 0))
        screen.blit(label, (bx + 10, 10))
        btn["rect"] = rect
        bx += width + BUTTON_PADDING

def handle_top_bar_click(mx, my):
    global mapdata, MAP_W, MAP_H, mapfile, action_highlight, highlight_time
    for i, btn in enumerate(buttons):
        if btn.get("rect") and btn["rect"].collidepoint(mx, my):
            # Set highlight for all action buttons
            for b in buttons:
                b['active'] = False
            btn['active'] = True
            action_highlight = i
            highlight_time = time.time()
            if btn["action"] == "save":
                save_map(mapfile, mapdata)
                show_feedback("Saved!")
            elif btn["action"] == "saveas":
                root = tk.Tk()
                root.withdraw()
                filename = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text files", "*.txt")])
                root.destroy()
                if filename:
                    save_map(filename, mapdata)
                    show_feedback(f"Saved as {os.path.basename(filename)}!")
            elif btn["action"] == "clear":
                clear_map()
            elif btn["action"] == "load":
                root = tk.Tk()
                root.withdraw()
                filename = filedialog.askopenfilename(defaultextension=".txt", filetypes=[("Text files", "*.txt")])
                root.destroy()
                if filename:
                    mapfile = filename
                    mapdata, MAP_W, MAP_H = load_map(mapfile)
                    show_feedback(f"Loaded {os.path.basename(filename)}!")
            elif btn["action"] == "exit":
                save_map(mapfile, mapdata)
                pygame.quit()
                import subprocess
                subprocess.Popen(["python3", "title_screen.py"])
                exit()
            elif btn["action"] == "generate":
                root = tk.Tk()
                root.withdraw()
                from tkinter import messagebox, simpledialog
                result = messagebox.askyesno("Warning", "This will erase your current usermap and generate a new random world. Continue?")
                if result:
                    # Ask which worldgen to use
                    worldgen_choice = simpledialog.askinteger(
                        "Worldgen Version",
                        "Which worldgen to use?\n1: Original (less smart)\n2: New (more realistic, but may be weird)\n3: Worldgen v3 (an improved version of worldgen v2)",
                        minvalue=1, maxvalue=3
                    )
                    root.destroy()
                    if worldgen_choice == 3:
                        import subprocess
                        subprocess.run(["python3", "worldgen3.py"])
                    elif worldgen_choice == 2:
                        import subprocess
                        subprocess.run(["python3", "worldgen2.py"])
                    else:
                        import subprocess
                        subprocess.run(["python3", "worldgen.py"])
                    # Reload the new usermap
                    mapfile = "usermap.txt"
                    mapdata, MAP_W, MAP_H = load_map(mapfile)
                    show_feedback("Random world generated!")
        else:
            btn['active'] = False

# UI state
feedback_message = None
feedback_time = 0
FEEDBACK_DURATION = 1.5  # seconds
# Track which button is highlighted for action feedback
action_highlight = None
highlight_time = 0
HIGHLIGHT_DURATION = 0.5  # seconds

# Main loop
running = True
mouse_down = False
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.VIDEORESIZE:
            screen = pygame.display.set_mode(event.size, pygame.RESIZABLE)
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_s:
                save_map(mapfile, mapdata)
                show_feedback("Saved!")
            elif event.key == pygame.K_ESCAPE:
                running = False
            elif event.key in (pygame.K_RIGHT, pygame.K_d):
                selected = (selected + 1) % len(TILE_KEYS)
            elif event.key in (pygame.K_LEFT, pygame.K_a):
                selected = (selected - 1) % len(TILE_KEYS)
            elif event.key in (pygame.K_0, pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4, pygame.K_5, pygame.K_6, pygame.K_8):
                key = chr(event.key)
                if key in TILE_KEYS:
                    selected = TILE_KEYS.index(key)
        elif event.type == pygame.MOUSEBUTTONDOWN:
            mx, my = pygame.mouse.get_pos()
            mouse_down = True
            # Top bar click
            if my < TOP_BAR_HEIGHT:
                handle_top_bar_click(mx, my)
            # Right bar click
            else:
                # UI scaling
                win_w, win_h = screen.get_size()
                map_area_h = win_h - TOP_BAR_HEIGHT - 40
                map_area_w = win_w - BAR_WIDTH
                tile_w = map_area_w // MAP_W
                tile_h = map_area_h // MAP_H
                tile_size = min(tile_w, tile_h)
                bar_x = tile_size * MAP_W + BAR_PADDING
                for i, code in enumerate(TILE_KEYS):
                    icon_y = TOP_BAR_HEIGHT + BAR_PADDING + i * (tile_size + BAR_PADDING)
                    if (bar_x <= mx < bar_x + tile_size and
                        icon_y <= my < icon_y + tile_size):
                        selected = i
                # Map click
                if mx < tile_size * MAP_W and TOP_BAR_HEIGHT <= my < tile_size * MAP_H + TOP_BAR_HEIGHT:
                    gx, gy = mx // tile_size, (my - TOP_BAR_HEIGHT) // tile_size
                    if 0 <= gx < MAP_W and 0 <= gy < MAP_H:
                        mapdata[gy][gx] = TILE_KEYS[selected]
        elif event.type == pygame.MOUSEBUTTONUP:
            mouse_down = False
        elif event.type == pygame.MOUSEMOTION and mouse_down:
            mx, my = pygame.mouse.get_pos()
            win_w, win_h = screen.get_size()
            map_area_h = win_h - TOP_BAR_HEIGHT - 40
            map_area_w = win_w - BAR_WIDTH
            tile_w = map_area_w // MAP_W
            tile_h = map_area_h // MAP_H
            tile_size = min(tile_w, tile_h)
            if mx < tile_size * MAP_W and TOP_BAR_HEIGHT <= my < tile_size * MAP_H + TOP_BAR_HEIGHT:
                gx, gy = mx // tile_size, (my - TOP_BAR_HEIGHT) // tile_size
                if 0 <= gx < MAP_W and 0 <= gy < MAP_H:
                    mapdata[gy][gx] = TILE_KEYS[selected]

    # UI scaling
    win_w, win_h = screen.get_size()
    map_area_h = win_h - TOP_BAR_HEIGHT - 40
    map_area_w = win_w - BAR_WIDTH
    tile_w = map_area_w // MAP_W
    tile_h = map_area_h // MAP_H
    tile_size = min(tile_w, tile_h)

    # Draw top bar
    draw_top_bar()

    # Draw map
    for y in range(MAP_H):
        for x in range(MAP_W):
            if x >= len(mapdata[y]):
                continue
            code = mapdata[y][x]
            if code in sprites:
                sprite = pygame.transform.scale(sprites[code], (tile_size, tile_size))
                screen.blit(sprite, (x * tile_size, y * tile_size + TOP_BAR_HEIGHT))
            pygame.draw.rect(screen, (50, 50, 50), (x * tile_size, y * tile_size + TOP_BAR_HEIGHT, tile_size, tile_size), 1)

    # Draw right bar
    bar_x = tile_size * MAP_W + BAR_PADDING
    pygame.draw.rect(screen, (200, 200, 200), (tile_size * MAP_W, TOP_BAR_HEIGHT, BAR_WIDTH, tile_size * MAP_H))
    for i, code in enumerate(TILE_KEYS):
        icon_y = TOP_BAR_HEIGHT + BAR_PADDING + i * (tile_size + BAR_PADDING)
        rect = pygame.Rect(bar_x - BAR_PADDING//2, icon_y - BAR_PADDING//2, tile_size + BAR_PADDING, tile_size + BAR_PADDING)
        if i == selected:
            pygame.draw.rect(screen, (255, 200, 0), rect, 3)
        else:
            pygame.draw.rect(screen, (180, 180, 180), rect, 1)
        icon_sprite = pygame.transform.scale(sprites[code], (tile_size, tile_size))
        screen.blit(icon_sprite, (bar_x, icon_y))
        # Draw code label
        label = font.render(code, True, (0, 0, 0))
        screen.blit(label, (bar_x + tile_size + 2, icon_y + 4))

    # Draw UI
    pygame.draw.rect(screen, (220, 220, 220), (0, tile_size * MAP_H + TOP_BAR_HEIGHT, tile_size * MAP_W + BAR_WIDTH, 40))
    info = f"Click a block on the right to select | Drag/click map to paint | S: Save | ESC: Quit | Selected: {TILE_TYPES[TILE_KEYS[selected]][0]} ({TILE_KEYS[selected]})"
    text = font.render(info, True, (0, 0, 0))
    screen.blit(text, (5, tile_size * MAP_H + TOP_BAR_HEIGHT + 5))

    # Draw feedback message
    if feedback_message and time.time() - feedback_time < FEEDBACK_DURATION:
        msgsurf = font.render(feedback_message, True, (0, 120, 0))
        msgrect = msgsurf.get_rect(center=(win_w // 2, TOP_BAR_HEIGHT // 2 + 2))
        screen.blit(msgsurf, msgrect)

    # Remove highlight from action buttons after a short duration
    if action_highlight is not None and time.time() - highlight_time > HIGHLIGHT_DURATION:
        if 0 <= action_highlight < len(buttons):
            buttons[action_highlight]['active'] = False
        action_highlight = None

    pygame.display.flip()

pygame.quit()
