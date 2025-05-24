import math
import random

# Tile codes as per mapeditor.py
TILE_CODES = ['0', '1', '2', '3', '4', '5', '6']
# '0': Grass, '1': Tree, '2': Rock, '3': Water1, '4': Water2, '5': Sand, '6': AppleTree

def perlin_noise(width, height, scale=10, octaves=1, persistence=0.5, lacunarity=2.0, seed=None):
    # Simple value noise for terrain generation
    if seed is not None:
        random.seed(seed)
    def lerp(a, b, t):
        return a + t * (b - a)
    def fade(t):
        return t * t * t * (t * (t * 6 - 15) + 10)
    grad = {}
    def grad2(x, y):
        if (x, y) not in grad:
            angle = random.uniform(0, 2 * math.pi)
            grad[(x, y)] = (math.cos(angle), math.sin(angle))
        return grad[(x, y)]
    def dot_grid_gradient(ix, iy, x, y):
        dx, dy = x - ix, y - iy
        gx, gy = grad2(ix, iy)
        return dx * gx + dy * gy
    def noise(x, y):
        x0, y0 = int(x), int(y)
        x1, y1 = x0 + 1, y0 + 1
        sx, sy = fade(x - x0), fade(y - y0)
        n0 = dot_grid_gradient(x0, y0, x, y)
        n1 = dot_grid_gradient(x1, y0, x, y)
        ix0 = lerp(n0, n1, sx)
        n0 = dot_grid_gradient(x0, y1, x, y)
        n1 = dot_grid_gradient(x1, y1, x, y)
        ix1 = lerp(n0, n1, sx)
        return lerp(ix0, ix1, sy)
    arr = [[0 for _ in range(width)] for _ in range(height)]
    maxval, minval = -float('inf'), float('inf')
    for y in range(height):
        for x in range(width):
            freq = scale
            amp = 1.0
            val = 0.0
            for _ in range(octaves):
                val += noise(x / freq, y / freq) * amp
                freq /= lacunarity
                amp *= persistence
            arr[y][x] = val
            maxval = max(maxval, val)
            minval = min(minval, val)
    # Normalize
    for y in range(height):
        for x in range(width):
            arr[y][x] = (arr[y][x] - minval) / (maxval - minval)
    return arr

def generate_world(width, height):
    """
    Realistic world generation using value noise for terrain heightmap.
    - Water, sand, grass, forest, rocks, and apple trees are placed based on terrain and biome logic.
    """
    # Generate heightmap
    heightmap = perlin_noise(width, height, scale=16, octaves=4, persistence=0.5, lacunarity=2.0)
    biomemap = perlin_noise(width, height, scale=8, octaves=2, persistence=0.5, lacunarity=2.0, seed=42)
    mapdata = [['0' for _ in range(width)] for _ in range(height)]
    for y in range(height):
        for x in range(width):
            h = heightmap[y][x]
            b = biomemap[y][x]
            # Water
            if h < 0.32:
                mapdata[y][x] = '3' if h < 0.28 else '4'  # Deep/shallow water
            # Beach
            elif h < 0.36:
                mapdata[y][x] = '5'
            # Grassland
            elif h < 0.7:
                if b > 0.6:
                    mapdata[y][x] = '1' if random.random() < 0.7 else '0'  # Forest
                elif b < 0.25:
                    mapdata[y][x] = '2' if random.random() < 0.3 else '0'  # Rocky
                else:
                    mapdata[y][x] = '0'  # Grass
            # Hills/forest
            else:
                if b > 0.5:
                    mapdata[y][x] = '1' if random.random() < 0.8 else '6'  # Dense forest/apple
                else:
                    mapdata[y][x] = '2' if random.random() < 0.5 else '0'  # Rocky hill
    # Add some clearings in forests
    for _ in range(random.randint(2, 4)):
        cx, cy = random.randint(5, width-6), random.randint(5, height-6)
        for _ in range(random.randint(8, 16)):
            dx, dy = random.randint(-2, 2), random.randint(-2, 2)
            x, y = cx + dx, cy + dy
            if 0 <= x < width and 0 <= y < height:
                if mapdata[y][x] in ('1', '6'):
                    mapdata[y][x] = '0'
    return mapdata

def save_world(filename, mapdata):
    with open(filename, 'w') as f:
        for i, row in enumerate(mapdata):
            line = ''.join(row)
            if i < len(mapdata) - 1:
                f.write(line + '\n')
            else:
                f.write(line)

def main():
    width, height = 41, 34  # Default size as in map.txt/usermap.txt
    mapdata = generate_world(width, height)
    save_world('usermap.txt', mapdata)
    print(f"Generated world saved to usermap.txt ({width}x{height})")

if __name__ == '__main__':
    main()
