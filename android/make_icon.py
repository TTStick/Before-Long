#!/usr/bin/env python3
"""生成启动图标的矢量图：一条麻花辫 + 一个发圈。"""
import math

W = 108
out = [f'<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="{W}" android:viewportHeight="{W}">']


def ellipse(cx, cy, rx, ry, rot, color):
    d = f"M{-rx:.2f},0 a{rx:.2f},{ry:.2f} 0 1,0 {2*rx:.2f},0 a{rx:.2f},{ry:.2f} 0 1,0 {-2*rx:.2f},0 Z"
    out.append(f'<group android:translateX="{cx:.2f}" android:translateY="{cy:.2f}" android:rotation="{rot:.1f}"><path android:fillColor="{color}" android:pathData="{d}"/></group>')


lobes = 7
dark, mid = "#8A6147", "#A97F60"
for i in range(lobes):
    s = -1 if i % 2 == 0 else 1
    y = 30 + i * 7.1
    ellipse(54 + s * 4.6, y, 8.6, 5.0, s * -34, dark if i % 2 == 0 else mid)

# 发圈下面的小辫梢
out.append('<path android:fillColor="#A97F60" android:pathData="M49,78 C46,84 47,88 49,92 C51,87 52,87 54,92 C56,87 57,87 59,92 C61,88 62,84 59,78 Z"/>')

# 发圈：一圈褶皱
cx, cy = 54, 77.5
pts = []
n = 96
for k in range(n + 1):
    a = k / n * 2 * math.pi
    m = 1 + abs(math.sin(a * 7)) * 0.13
    pts.append((cx + math.cos(a) * 13.5 * m, cy + math.sin(a) * 6.8 * m))
d = "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts) + " Z"
out.append(f'<path android:fillColor="#E58FA0" android:pathData="{d}"/>')
out.append(f'<path android:strokeColor="#F7C4CE" android:strokeWidth="1.3" android:strokeLineCap="round" android:pathData="M{cx-9:.1f},{cy-2.8:.1f} Q{cx},{cy-5.4:.1f} {cx+9:.1f},{cy-2.8:.1f}"/>')
out.append('</vector>')

with open('res/drawable/ic_fg.xml', 'w', encoding='utf8') as f:
    f.write("\n".join(out))
print('icon written')
