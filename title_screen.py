import pygame
from sys import exit
import math

# pygame setup
pygame.init()

screen = pygame.display.set_mode((1280, 720), 
                                 pygame.RESIZABLE)
font = pygame.font.Font(None, 120)
small_font = pygame.font.Font(None, 48)
mini_font = pygame.font.Font(None, 32)
subtitle_font = pygame.font.Font(None, 40)

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (120, 120, 120)
LIGHT_GRAY = (180, 180, 200)
BUTTON_COLOR = (140, 150, 220)
BUTTON_HOVER = (170, 180, 255)
YELLOW = (255, 255, 60)

# Title and subtitle
logo_text = font.render("UH sim", True, WHITE)
subtitle = subtitle_font.render("Gotta love AI!", True, YELLOW)

# Button setup
def draw_button(rect, text, hovered):
    color = BUTTON_HOVER if hovered else BUTTON_COLOR
    pygame.draw.rect(screen, color, rect, border_radius=8)
    pygame.draw.rect(screen, WHITE, rect, 3, border_radius=8)
    label = small_font.render(text, True, WHITE)
    label_rect = label.get_rect(center=rect.center)
    screen.blit(label, label_rect)

play_rect = pygame.Rect(490, 320, 300, 60)
mapeditor_rect = pygame.Rect(490, 400, 300, 60)

# Version and credit
version_text = mini_font.render("UnstableAI 0.1.2 Beta", True, WHITE)

spin_angle = 0
spin_speed = 0.1  # degrees per frame
breath_phase = 0
breath_speed = 0.025  # controls breathing speed

# Main loop
while True:
    mouse_pos = pygame.mouse.get_pos()
    mouse_click = False
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            exit()
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            mouse_click = True

    # Animate spinning lines
    spin_angle = (spin_angle + spin_speed) % 360
    breath_phase = (breath_phase + breath_speed) % (2 * math.pi)
    # Calculate breathing color
    breath = (math.sin(breath_phase) + 1) / 2  # 0..1
    # Interpolate between LIGHT_GRAY and a very grayish blue
    base = LIGHT_GRAY
    blue = (160, 160, 250)
    line_color = (
        int(base[0] * (1-breath) + blue[0] * breath),
        int(base[1] * (1-breath) + blue[1] * breath),
        int(base[2] * (1-breath) + blue[2] * breath),
    )

    # Background
    screen.fill(GRAY)
    # Draw faint lines for style (like rays), spinning and breathing
    for angle in range(0, 360, 20):
        a = angle + spin_angle
        x = int(640 + 2000 * math.cos(math.radians(a)))
        y = int(360 + 2000 * math.sin(math.radians(a)))
        pygame.draw.aaline(screen, line_color, (640, 360), (x, y), 1)

    # Title
    logo_rect = logo_text.get_rect(center=(640, 120))
    screen.blit(logo_text, logo_rect)
    # Subtitle (rotated)
    subtitle_rot = pygame.transform.rotate(subtitle, 15)
    screen.blit(subtitle_rot, (logo_rect.right - 100, logo_rect.top + 40))

    # Play button only
    play_hover = play_rect.collidepoint(mouse_pos)
    draw_button(play_rect, "Play", play_hover)

    # Map Editor button
    mapeditor_hover = mapeditor_rect.collidepoint(mouse_pos)
    draw_button(mapeditor_rect, "Map editor", mapeditor_hover)

    # Character preview (right side)
    # Draw label '4chan user' above character
    char_label = small_font.render("Daaniel", True, WHITE)
    char_label_rect = char_label.get_rect(center=(1050, 200))
    screen.blit(char_label, char_label_rect)

    # Draw stickman instead of soyjak
    stick_center = (1050, 320)
    stick_color = WHITE
    # Head
    pygame.draw.circle(screen, stick_color, (stick_center[0], stick_center[1] - 60), 25, 3)
    # Body
    pygame.draw.line(screen, stick_color, (stick_center[0], stick_center[1] - 35), (stick_center[0], stick_center[1] + 60), 3)
    # Arms
    pygame.draw.line(screen, stick_color, (stick_center[0] - 40, stick_center[1]), (stick_center[0] + 40, stick_center[1]), 3)
    # Left leg
    pygame.draw.line(screen, stick_color, (stick_center[0], stick_center[1] + 60), (stick_center[0] - 30, stick_center[1] + 120), 3)
    # Right leg
    pygame.draw.line(screen, stick_color, (stick_center[0], stick_center[1] + 60), (stick_center[0] + 30, stick_center[1] + 120), 3)

    # Version and credit
    screen.blit(version_text, (10, 680))
    # Credit text as a button
    credit_bg = pygame.Surface((260, 36))
    credit_bg.set_alpha(180)
    credit_bg.fill((180, 60, 60) if mouse_pos[0] >= 1010 and mouse_pos[1] >= 670 and mouse_pos[0] < 1010+260 and mouse_pos[1] < 670+36 and mouse_click else BLACK)
    screen.blit(credit_bg, (1010, 670))
    screen.blit(mini_font.render("made with <3 by ai", True, YELLOW if mouse_pos[0] >= 1010 and mouse_pos[1] >= 670 and mouse_pos[0] < 1010+260 and mouse_pos[1] < 670+36 else WHITE), (1020, 680))

    # Play button click
    if play_hover and mouse_click:
        import Code
        Code.main()  # Assumes Code.py has a main() function
        break  # Exit the title screen loop, but do not call exit()

    # Map Editor button click
    if mapeditor_hover and mouse_click:
        import subprocess
        subprocess.Popen(["python3", "mapeditor.py"])
        break

    # Delete usermap.txt if credit is clicked
    if (mouse_pos[0] >= 1010 and mouse_pos[1] >= 670 and mouse_pos[0] < 1010+260 and mouse_pos[1] < 670+36) and mouse_click:
        import os
        try:
            os.remove("usermap.txt")
        except Exception as e:
            print(f"Error deleting usermap.txt: {e}")
        # Feedback: flash the button red
        for _ in range(8):
            credit_bg.fill((255, 0, 0))
            screen.blit(credit_bg, (1010, 670))
            screen.blit(mini_font.render("made with <3 by ai", True, YELLOW), (1020, 680))
            pygame.display.update()
            pygame.time.delay(40)
            credit_bg.fill((180, 60, 60))
            screen.blit(credit_bg, (1010, 670))
            screen.blit(mini_font.render("made with <3 by ai", True, YELLOW), (1020, 680))
            pygame.display.update()
            pygame.time.delay(40)

    pygame.display.update()