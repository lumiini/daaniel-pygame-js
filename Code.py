import pygame
from sys import exit
import math
from random import randint
import os

# pygame setup
pygame.init()
screen = pygame.display.set_mode((1280, 720))
clock = pygame.time.Clock()

#images
image_Grass = pygame.image.load("Sprites/Map/Grass.png").convert()
image_Tree = pygame.image.load("Sprites/Map/Tree.png").convert()
image_Rock = pygame.image.load("Sprites/Map/Rock.png").convert()
image_Water1 = pygame.image.load("Sprites/Map/Water1.png").convert()
image_Water2 = pygame.image.load("Sprites/Map/Water2.png").convert()
image_Sand = pygame.image.load("Sprites/Map/Sand.png").convert()
image_AppleTree = pygame.image.load("Sprites/Map/AppleTree.png").convert()
image_Wood_wall = pygame.image.load("Sprites/Map/Wood_wall.png").convert()
image_Sapling = pygame.image.load("Sprites/Map/sapling.png").convert()

player_image = pygame.image.load("Sprites/Player1.png").convert_alpha()
inventory_image_1 = pygame.image.load("Sprites/Inventory/Inventory_box/Inventory_1.png").convert()
inventory_image_2 = pygame.image.load("Sprites/Inventory/Inventory_box/Inventory_2.png").convert()
inventory_image_3 = pygame.image.load("Sprites/Inventory/Inventory_box/Inventory_3.png").convert()
inventory_image_4 = pygame.image.load("Sprites/Inventory/Inventory_box/Inventory_4.png").convert()
inventory_image_5 = pygame.image.load("Sprites/Inventory/Inventory_box/Inventory_5.png").convert()


image_Apple = pygame.image.load("Sprites/Inventory/Apple.png").convert()
image_Wood = pygame.image.load("Sprites/Inventory/Wood.png").convert()
image_Sapling_inventory = pygame.image.load("Sprites/Inventory/Sapling.png").convert()
image_axe_inventory = pygame.image.load("Sprites/Inventory/Axe.png").convert()
image_Plank = pygame.image.load("Sprites/Inventory/Plank.png").convert()

#fonts
font = pygame.font.Font(None, 50)
SmallFont = pygame.font.Font(None, 20)
CraftingFont = pygame.font.Font(None, 40)

#variables
offset_x = 600
offset_y = 400
speed = 5
global_list = None
fps = 60
max_fps = -1

click_held = False
right_held = False
left_held = False

#classes
class Player(pygame.sprite.Sprite):
    def __init__(self, Health):
        super().__init__()
        self.Health = Health

        #initialising sprite
        self.image = player_image
        self.rect = self.image.get_rect()

        #positioning
        self.rect.x = 640 - self.rect.centerx
        self.rect.y = 360 - self.rect.centery
        self.dir = 0

        #othervariables
        self.frame_counter = 0
        self.starting_health = Health


    def rotate(self):
        global global_dir
        
        keys = pygame.key.get_pressed()

        if keys[pygame.K_s]:
            self.dir = 0
            if keys[pygame.K_a]:
                self.dir += 45
            if keys[pygame.K_d]:
                self.dir -= 45

        if keys[pygame.K_w]:
            self.dir = 180
            if keys[pygame.K_a]:
                self.dir -= 45
            if keys[pygame.K_d]:
                self.dir += 45
            
        if keys[pygame.K_d]:
            self.dir = 90
            if keys[pygame.K_w]:
                self.dir += 45
            if keys[pygame.K_s]:
                self.dir -= 45
            
        if keys[pygame.K_a]:
            self.dir = 270
            if keys[pygame.K_w]:
                self.dir -= 45
            if keys[pygame.K_s]:
                self.dir += 45

        global_dir = self.dir

        self.image = pygame.transform.rotate(player_image, self.dir - 180)
        self.rect = self.image.get_rect()

        self.rect.x = 640 - self.rect.centerx
        self.rect.y = 360 - self.rect.centery

    def health(self):
        #updating health value
        self.Health -= 0.04 / fps * 60

        if self.Health > self.starting_health:
            self.Health = self.starting_health

        #drawing healthbar
        health_backround = pygame.Surface((self.starting_health + 10, 30))
        screen.blit(health_backround, (15, 15))

        try:
            healthBar = pygame.Surface((round(self.Health, -1), 20))
            healthBar.fill((128, 0, 0))
            screen.blit(healthBar, (20, 20))
        except pygame.error:
            #if died
            exit()

    def update(self):
        self.rotate()
        self.health()

class Inventory():
    def __init__(self, apple, wood, holding, sapling, plank):
        self.apple = apple
        self.wood = wood
        self.holding = holding
        self.sapling = sapling
        self.plank = plank
        
        self.holding_tile = 1
        self.menu_open = False
        self.c_key_held = False
        self.space_key_held = False
        self.menu_selection = 1
        self.inventory_list = ["axe", -1]
        self.list_of_all_items = ["axe", -1,"apple", self.apple, "wood", self.wood, "sapling", self.sapling, "plank", self.plank]

    def create_list(self):
        self.list_of_all_items = ["axe", -1, "apple", self.apple, "wood", self.wood, "sapling", self.sapling, "plank", self.plank]
        number = 0

        for _ in range(int(len(self.list_of_all_items) / 2)):
            list_str = self.list_of_all_items[number]
            list_item = self.list_of_all_items[number + 1]


            if not list_str in self.inventory_list and list_item > 0:
                #add items to list
                self.inventory_list.extend((list_str, str(list_item)))
            elif list_str in self.inventory_list and list_item > 0:
                #Update the number of an item
                list_number = 0
                
                for i in self.inventory_list:
                    if i == list_str:
                        self.inventory_list.pop(list_number + 1)
                        self.inventory_list.insert(list_number + 1, str(list_item))

                    list_number += 1
            elif list_str in self.inventory_list and list_item == 0:
                #Remove items from list
                list_number = 0
                
                for i in self.inventory_list:
                    if i == list_str:
                        self.inventory_list.pop(list_number + 1)
                        self.inventory_list.pop(list_number)

                    list_number += 1
            
            number += 2

        print(self.inventory_list)

    def change_holding(self):
        keys = pygame.key.get_pressed()
        
        #Using numbers
        if keys[pygame.K_1]:
            self.holding_tile = 1
        if keys[pygame.K_2]:
            self.holding_tile = 2
        if keys[pygame.K_3]:
            self.holding_tile = 3
        if keys[pygame.K_4]:
            self.holding_tile = 4
        if keys[pygame.K_5]:
            self.holding_tile = 5

        #Using left and right arrow keys
        global right_held
        global left_held
        
        if not keys[pygame.K_RIGHT]:
            right_held = False

        if not keys[pygame.K_LEFT]:
            left_held = False

        if keys[pygame.K_RIGHT] and self.holding_tile < 5 and right_held == False:
            self.holding_tile += 1
            right_held = True

        if keys[pygame.K_LEFT] and self.holding_tile > 1 and left_held == False:
            self.holding_tile -= 1
            left_held = True

        try:
            if self.inventory_list[(self.holding_tile - 1) * 2] == "axe":
                self.holding = "axe"
            if self.inventory_list[(self.holding_tile - 1) * 2] == "apple":
                self.holding = "apple"
            if self.inventory_list[(self.holding_tile - 1) * 2] == "wood":
                self.holding = "wood"
            if self.inventory_list[(self.holding_tile - 1) * 2] == "sapling":
                self.holding = "sapling"
            if self.inventory_list[(self.holding_tile - 1) * 2] == "plank":
                self.holding = "plank"
        except IndexError:
            self.holding = "fist"


    def draw_inventory(self):
        if self.holding_tile == 1:
            screen.blit(inventory_image_1, (440, 630))
        if self.holding_tile == 2:
            screen.blit(inventory_image_2, (440, 630))
        if self.holding_tile == 3:
            screen.blit(inventory_image_3, (440, 630))
        if self.holding_tile == 4:
            screen.blit(inventory_image_4, (440, 630))
        if self.holding_tile == 5:
            screen.blit(inventory_image_5, (440, 630))
        
        number = 0

        #draw inventory sprites
        for _ in range(int(len(self.list_of_all_items) / 2)):
            if len(self.inventory_list) > number:
                if self.inventory_list[number] == "apple":
                    screen.blit(image_Apple, (455 + number * 40, 640))
                if self.inventory_list[number] == "wood":
                    screen.blit(image_Wood, (455 + number * 40, 640))
                if self.inventory_list[number] == "sapling":
                    screen.blit(image_Sapling_inventory, (455 + number * 40, 640))
                if self.inventory_list[number] == "axe":
                    screen.blit(image_axe_inventory, (455 + number * 40, 640))
                if self.inventory_list[number] == "plank":
                    screen.blit(image_Plank, (455 + number * 40, 640))

            number += 2
        
        number = 1

        #draw numbers
        for _ in range(int(len(self.list_of_all_items) / 2)):
            if len(self.inventory_list) > number:
                if self.inventory_list[number - 1] in ("apple", "wood", "sapling", "axe", "plank"):
                    if not self.inventory_list[number] == -1:
                        text = SmallFont.render(self.inventory_list[number], True, "Black")
                        screen.blit(text, (415 + number * 40, 640))

            number += 2

    def craft(self):
        keys = pygame.key.get_pressed()
        
        if not keys[pygame.K_SPACE]:
            self.space_key_held = False

        if not keys[pygame.K_c]:
            self.c_key_held = False

        #menu opening and closing
        if keys[pygame.K_c] and self.c_key_held == False:
            if self.menu_open == True:
                self.menu_open = False
            else:
                self.menu_open = True

            self.c_key_held = True
        
        if self.menu_open:
            if self.wood >= 4:
                #draw crafting menu
                text = CraftingFont.render(f"3 wood --> 1 plank [{int(self.wood / 4)}]", True, "Black")
                screen.blit(text, (20, 50))
            
            if self.menu_selection == 1 and self.wood >= 3 and self.space_key_held == False and keys[pygame.K_SPACE]:
                #crafts planks
                self.plank += 1
                self.wood -= 3

                self.space_key_held = True

            click_held = True

    def update(self):
        self.create_list()
        self.change_holding()
        self.draw_inventory()
        self.craft()

inventory = Inventory(0, 0, 1, 0, 0)

#functions
def FPS():
    global fps
    keys = pygame.key.get_pressed()

    if keys[pygame.K_f]:
        text = font.render("FPS: "  + str(round(clock.get_fps())), True, "Black")
        screen.blit(text, (20, 670))

    if not clock.get_fps() == 0:
        fps = clock.get_fps()

def scroll():
    global offset_y
    global offset_x
    global last_offset_x
    global last_offset_y

    last_offset_x = offset_x
    last_offset_y = offset_y
    
    keys = pygame.key.get_pressed()

    if keys[pygame.K_s] or keys[pygame.K_w] or keys[pygame.K_d] or keys[pygame.K_a]:
        #does the equivilant of what deltatime does (if it can)
        offset_x += math.sin(global_dir / 57.2957795131) * speed / fps * 60
        offset_y += math.cos(global_dir / 57.2957795131) * speed / fps * 60
        print (fps)

def Generate(File):
    global map_width
    global global_list
    
    if global_list == None:
        #open file
        with open(File) as f:
            text = f.read()
            list = []

        #listify
        map_width = 0

        for i in text:
            if not i == " " and not i == "\n":
                map_width += 1
                list.append(i)
            elif i == "\n":
                map_width = 0

        global_list = list

    #generate
    tile_number = 0
    x = 0
    y = 0

    for tile in global_list:
        #drawing the map
        if x - offset_x < 1500 and y - offset_y < 1500:
            if tile == "0":
                screen.blit(image_Grass, (x - offset_x, y - offset_y))

            if tile == "1" or tile == "7":
                screen.blit(image_Tree, (x - offset_x, y - offset_y))

            if tile == "2":
                screen.blit(image_Rock, (x - offset_x, y - offset_y))
            
            if tile == "3":
                screen.blit(image_Water1, (x - offset_x, y - offset_y))

            if tile == "4":
                screen.blit(image_Water2, (x - offset_x, y - offset_y))

            if tile == "5":
                screen.blit(image_Sand, (x - offset_x, y - offset_y))

            if tile == "6":
                screen.blit(image_AppleTree, (x - offset_x, y - offset_y))

            if tile == "8":
                screen.blit(image_Wood_wall, (x - offset_x, y - offset_y))
            
            if tile == "s":
                screen.blit(image_Sapling, (x - offset_x, y - offset_y))


        tile_number += 1

        #calculating x and y
        if x == map_width * 128 - 128:
            y += 128
            x = 0
        else:
            x += 128

def collision():
    global offset_x
    global offset_y
    global last_offset_x
    global last_offset_y
    global speed

    tile = global_list[x + y * map_width]

    if tile == "1" or tile == "7":
        offset_x = last_offset_x
        offset_y = last_offset_y

    if tile == "6":
        offset_x = last_offset_x
        offset_y = last_offset_y
    
    if tile == "2" or tile == "8":
        offset_x = last_offset_x
        offset_y = last_offset_y

    if tile == "3":
        speed = 2
    
    if tile == "4":
        speed = 3

    if tile == "0" or tile == "5":
        speed = 5

def edit():
    global click_held
    left_click = pygame.mouse.get_pressed()[0]
    keys = pygame.key.get_pressed()

    #checks if clicking
    if not left_click and not keys[pygame.K_c]:
        click_held = False
    
    #harvesting
    if inventory.holding in ("fist", "apple", "plank", "sapling", "wood") and left_click and global_list[mouse_x + mouse_y * map_width] == "6" and abs(x - mouse_x) < 2 and abs(y - mouse_y) < 2:
        global_list.pop(mouse_x + mouse_y * map_width)
        global_list.insert(mouse_x + mouse_y * map_width, "7")
        inventory.apple += 3 #harvest apples
        
        click_held = True

    if inventory.holding == "axe" and left_click and global_list[mouse_x + mouse_y * map_width] in ("6", "7", "8", "s") and abs(x - mouse_x) < 2 and abs(y - mouse_y) < 2:
        if global_list[mouse_x + mouse_y * map_width] == "6":
            inventory.apple += randint(0, 1)
            inventory.wood += randint(2, 3)
            inventory.sapling += randint(0, 2)
            if randint(1, 5) == 1:
                inventory.sapling += 1
        if global_list[mouse_x + mouse_y * map_width] == "7":
            inventory.wood += randint(2, 3)
            inventory.sapling += randint(0, 2)
            if randint(1, 3)== 1:
                inventory.sapling += 1
        if global_list[mouse_x + mouse_y * map_width] == "8":
            inventory.wood += 1
        if global_list[mouse_x + mouse_y * map_width] == "s":
            inventory.sapling += 1

        global_list.pop(mouse_x + mouse_y * map_width)
        global_list.insert(mouse_x + mouse_y * map_width, "0")


    #placing
    if abs(x - mouse_x) == 0 and abs(y - mouse_y) == 0:
        placing_on_standing = True
    else:
        placing_on_standing = False

    if inventory.holding == "plank" and inventory.plank > 0 and left_click and global_list[mouse_x + mouse_y * map_width] in ("0", "5", "4", "3") and abs(x - mouse_x) < 2 and abs(y - mouse_y) < 2 and not placing_on_standing:
        global_list.pop(mouse_x + mouse_y * map_width)
        global_list.insert(mouse_x + mouse_y * map_width, "8")
        inventory.plank -= 1

    if inventory.holding == "sapling" and inventory.sapling > 0 and left_click and global_list[mouse_x + mouse_y * map_width] == "0" and abs(x - mouse_x) < 2 and abs(y - mouse_y) < 2:
        global_list.pop(mouse_x + mouse_y * map_width)
        global_list.insert(mouse_x + mouse_y * map_width, "s")
        inventory.sapling -= 1

    #regrowing
    tile_number = 0

    for tile in global_list:
        if tile == "7" and randint(1, 3000) == 1:
            global_list.pop(tile_number)
            global_list.insert(tile_number, "6")

        tile_number += 1

    tile_number = 0

    for tile in global_list:
        if tile == "s" and randint(1, 3000) == 1:
            global_list.pop(tile_number)
            global_list.insert(tile_number, "7")

        tile_number += 1
        
    #consuming
    if inventory.holding == "apple" and left_click and click_held == False:
        player_character.Health += 50
        inventory.apple -= 1

        click_held = True

#groups
player_group = pygame.sprite.GroupSingle()
player_character = Player(300)
player_group.add(player_character)

while True:
    keys = pygame.key.get_pressed()
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            exit()

    screen.fill((0, 0, 0))

    ###_RPG_###
    #use usermap.txt if exists if not map.txt
    map_file = "usermap.txt" if os.path.exists("usermap.txt") else "map.txt"
    Generate(map_file)

    player_group.draw(screen)
    player_group.update()

    scroll()

    x = int((offset_x + 640) / 128)
    y = int((offset_y + 360) / 128)

    mos_x = pygame.mouse.get_pos()[0]
    mos_y = pygame.mouse.get_pos()[1]

    mouse_x = int((offset_x + mos_x) / 128)
    mouse_y = int((offset_y + mos_y) / 128)

    edit()
    collision()
    inventory.update()

    FPS()

    ###_RPG_###

    pygame.display.update()
    clock.tick(max_fps)