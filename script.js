const rp=n=>'Rp'+Math.round(n).toLocaleString('id-ID');
const COLORS={Manga:'#1f3a5f',Fantasi:'#4a3f7a',Aksi:'#9b1c2c',Romansa:'#8a3b62','Slice of Life':'#2f6f62','Box Set':'#3b3b42'};
const SEED=[
['Raja Menara Vol. 1','Fantasi',55000,12],['Raja Menara Vol. 2','Fantasi',55000,9],['Penyihir Bulan Vol. 1','Fantasi',52000,10],
['Pemburu Bayangan Vol. 1','Aksi',58000,14],['Pemburu Bayangan Vol. 2','Aksi',58000,11],['Pedang Tanpa Nama Vol. 3','Aksi',54000,6],
['Putri Rembulan Vol. 2','Romansa',52000,8],['Surat untuk Musim Semi Vol. 1','Romansa',50000,7],['Kafe di Ujung Senja Vol. 1','Slice of Life',48000,10],
['Raja Menara Box Set 1-5','Box Set',250000,3],['Pemburu Bayangan Box Set 1-4','Box Set',215000,2],['Dapur Si Naga Vol. 1','Slice of Life',46000,0],
['Attack on Titan Vol. 1','Manga',35000,15],['Attack on Titan Vol. 2','Manga',35000,12],['Attack on Titan Vol. 3','Manga',35000,10]
].map((p,i)=>({id:i+1,title:p[0],cat:p[1],price:p[2],stock:p[3]}));
let products,history,cart={};
try{products=JSON.parse(localStorage.getItem('kk_p2'))||null;history=JSON.parse(localStorage.getItem('kk_h'))||null}catch(e){}
products=products||SEED.map(x=>({...x}));history=history||[];
SEED.forEach(s=>{if(!products.some(p=>p.title===s.title))products.push({...s,id:Math.max(0,...products.map(p=>p.id))+1})});
const save=()=>{try{localStorage.setItem('kk_p2',JSON.stringify(products));localStorage.setItem('kk_h',JSON.stringify(history))}catch(e){}};
const $=id=>document.getElementById(id);

$('cat').innerHTML='<option value="">Semua kategori</option>'+Object.keys(COLORS).map(c=>`<option>${c}</option>`).join('');

function renderGrid(){
 const q=$('q').value.toLowerCase(),c=$('cat').value;
 const list=products.filter(p=>p.title.toLowerCase().includes(q)&&(!c||p.cat===c));
 $('grid').innerHTML=list.length?list.map(p=>{const left=p.stock-(cart[p.id]||0);
  return `<button class="card" data-id="${p.id}" ${left<=0?'disabled':''}><div class="cover" style="background:${COLORS[p.cat]}">${p.cat}</div><div class="info"><b>${p.title}</b><span class="price">${rp(p.price)}</span><br><small>${p.stock===0?'Stok habis':'Stok '+left}</small></div></button>`}).join(''):'<p>Tidak ada komik yang cocok. Ubah kata kunci atau kategori.</p>';
}
function totals(){
 const sub=Object.entries(cart).reduce((s,[id,q])=>s+products.find(p=>p.id==id).price*q,0);
 const d=Math.min(100,Math.max(0,+$('disc').value||0));
 const total=sub*(1-d/100);return{sub,total,d};
}
function renderCart(){
 const ids=Object.keys(cart);
 $('cart').innerHTML=ids.length?ids.map(id=>{const p=products.find(x=>x.id==id);return `<div class="row"><div><b>${p.title}</b><br><small>${rp(p.price)}</small></div><div class="qty"><button data-d="-1" data-id="${id}" aria-label="Kurangi">-</button> ${cart[id]} <button data-d="1" data-id="${id}" aria-label="Tambah">+</button></div></div>`}).join(''):'<p>Keranjang kosong. Klik komik untuk menambahkan.</p>';
 const t=totals();$('sub').textContent=rp(t.sub);$('total').textContent=rp(t.total);
 const paid=+$('paid').value||0;$('cashBox').hidden=$('method').value!=='Tunai';const diff=paid-t.total,short=paid>0&&diff<0;$('chgL').textContent=short?'Kurang':'Kembalian';$('chg').textContent=rp(paid>0?Math.abs(diff):0);$('chg').style.color=short?'var(--red)':'';
 $('go').disabled=!ids.length;$('go').textContent='Bayar';renderGrid();
}
$('grid').onclick=e=>{const b=e.target.closest('.card');if(!b)return;const id=b.dataset.id,p=products.find(x=>x.id==id);
 if((cart[id]||0)<p.stock){cart[id]=(cart[id]||0)+1;renderCart()}};
$('cart').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id,p=products.find(x=>x.id==id);
 cart[id]=(cart[id]||0)+ +b.dataset.d;if(cart[id]<=0)delete cart[id];if(cart[id]>p.stock)cart[id]=p.stock;renderCart()};
['q','cat'].forEach(i=>$(i).oninput=renderGrid);
['disc','paid','method'].forEach(i=>$(i).oninput=renderCart);
$('clr').onclick=()=>{cart={};$('err').textContent='';renderCart()};

$('go').onclick=()=>{
 const t=totals(),m=$('method').value,cash=m==='Tunai',paid=cash?(+$('paid').value||0):t.total;
 if(cash&&paid<t.total){$('err').textContent='Uang diterima kurang '+rp(t.total-paid)+'. Masukkan jumlah yang cukup.';return}
 $('err').textContent='';
 const items=Object.entries(cart).map(([id,q])=>{const p=products.find(x=>x.id==id);p.stock-=q;return{title:p.title,qty:q,price:p.price}});
 const trx={method:m,no:history.length+1,time:new Date().toLocaleString('id-ID'),items,sub:t.sub,d:t.d,total:t.total,paid,change:paid-t.total};
 history.unshift(trx);save();
 showReceipt(trx);cart={};$('paid').value='';$('disc').value=0;renderCart();renderHist();
};
function showReceipt(t){
 const m=t.method||'Tunai';
 $('rcpt').innerHTML=`<h2 class="big" style="margin:0">MANGA DISTRICT</h2><div class="ctr">Struk #${t.no}<br>${t.time}</div><hr>`+
  t.items.map(i=>`<div>${i.title}</div><div class="tot"><span>${i.qty} x ${rp(i.price)}</span><span>${rp(i.qty*i.price)}</span></div>`).join('')+
  `<hr><div class="tot"><span>Subtotal</span><span>${rp(t.sub)}</span></div><div class="tot"><span>Diskon ${t.d}%</span><span>-${rp(t.sub-t.total)}</span></div><div class="tot"><b>Total</b><b>${rp(t.total)}</b></div><div class="tot"><span>Bayar (${m})</span><span>${rp(t.paid)}</span></div>`+
  (m==='Tunai'?`<div class="tot"><span>Kembali</span><span>${rp(t.change)}</span></div>`:'')+
  `<hr><div class="ctr">Terima kasih sudah berbelanja!</div>`;
 $('pmsg').textContent='';
 if(!$('dlg').open)$('dlg').showModal();
}
$('ok').onclick=()=>$('dlg').close();
function printReceipt(){
 const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Struk</title><style>body{font:13px 'Courier New',monospace;width:76mm;margin:0 auto;padding:4mm;color:#000}.tot{display:flex;justify-content:space-between}.ctr{text-align:center}h2{text-align:center;margin:0;font-size:22px}hr{border:0;border-top:1px dashed #000}</style></head><body>${$('rcpt').innerHTML}</body></html>`;
 let w=null;
 try{w=window.open('','_blank')}catch(e){}
 if(w){w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),300);return}
 try{window.print()}catch(e){}
 $('pmsg').textContent='Jendela cetak belum muncul? Browser memblokir cetak dari tombol ini. Tekan Ctrl+P (atau menu Cetak di browser) saat struk terbuka. Hanya struk yang akan tercetak.';
}
$('prt').onclick=printReceipt;
$('hist').onclick=e=>{const b=e.target.closest('button');if(b)showReceipt(history.find(h=>h.no==b.dataset.no))};

function renderHist(){
 const sum=history.reduce((s,h)=>s+h.total,0);
 $('sum').textContent=history.length?`${history.length} transaksi, omzet ${rp(sum)}`:'Belum ada transaksi. Selesaikan pembayaran di halaman Kasir.';
 $('hist').innerHTML=history.map(h=>`<tr><td>${h.no}</td><td>${h.time}</td><td>${h.items.map(i=>i.qty+'x '+i.title).join(', ')}</td><td>${rp(h.total)}</td><td>${h.method||'Tunai'}</td><td><button class="mini" data-no="${h.no}">Cetak</button></td></tr>`).join('');
}
function show(k){$('vKasir').hidden=k!=='k';$('vRiwayat').hidden=k==='k';
 $('tKasir').setAttribute('aria-pressed',k==='k');$('tRiwayat').setAttribute('aria-pressed',k!=='k')}
$('tKasir').onclick=()=>show('k');$('tRiwayat').onclick=()=>show('r');
function armed(btn,label,fn){let t;btn.onclick=()=>{if(btn.dataset.arm){clearTimeout(t);delete btn.dataset.arm;btn.textContent=label;fn();return}btn.dataset.arm=1;btn.textContent='Klik lagi untuk konfirmasi';t=setTimeout(()=>{delete btn.dataset.arm;btn.textContent=label},4000)}}
armed($('clrHist'),'Hapus riwayat penjualan',()=>{history=[];save();renderHist()});
armed($('reset'),'Reset data stok dan riwayat',()=>{products=SEED.map(x=>({...x}));history=[];cart={};save();renderCart();renderHist()});
renderCart();renderHist();
