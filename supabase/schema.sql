-- 园猫小铺：商品表（所有人可读，只能在 Supabase 后台改）
create table public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null,
  image text not null,
  sort int not null default 0
);

alter table public.products enable row level security;
create policy "products are public" on public.products for select using (true);
grant select on public.products to anon, authenticated;

-- 商品
insert into public.products (id, name, description, price, image, sort) values
  ('paper-model',   '拙政园榫卯纸模型', '小飞虹、香洲等园中建筑做成纸板拼装模型，榫卯插接，照着图纸一块块搭起亭台楼阁。', 98, 'img/shop/paper-model.jpg', 1),
  ('stamps',        '苏州景点叠色印章', '苏州博物馆等景点做成套色印章，几种颜色叠盖成一幅画，适合打卡集章。', 58, 'img/shop/stamps.jpg', 2),
  ('leather-charm', '海棠纹皮革挂件',   '菱形皮革上拼出四瓣海棠纹，像园中铺地的花样。四种配色，挂包挂钥匙都好看。', 45, 'img/shop/leather-charm.jpg', 3),
  ('ar-postcard',   'AR 古画明信片',    '印着文徵明《拙政园图》。用手机扫卡面二维码，画里的园景会在屏幕上立起来。', 25, 'img/shop/ar-postcard.jpg', 4);
