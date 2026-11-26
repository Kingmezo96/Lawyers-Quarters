(function(){
var story=window.LQ_PUSG;if(!story)return;
var url='post.html?slug='+story.slug;
var lead=null; // Homepage lead is rendered in HTML before slider initialization.
if(lead){lead.dataset.title=story.title;lead.dataset.category='scholarship welfare education';lead.querySelector('.slide-image').style.backgroundImage='url('+story.image+')';lead.querySelector('h1 a').textContent=story.title;lead.querySelector('.swiper-content>p').textContent=story.excerpt;lead.querySelectorAll('a').forEach(function(a){a.href=url});lead.querySelector('.entry-category a').textContent='Law School Scholarship';lead.querySelector('.entry-author').innerHTML='<a class="white" href="'+url+'">Read full story →</a>';}
document.addEventListener('DOMContentLoaded',function(){
if(new URLSearchParams(location.search).get('slug')!==story.slug)return;
var body=document.querySelector('.lq-post-body');if(!body)return;
var quote=body.querySelector('blockquote');if(quote)quote.remove();
var headings=['From Five Beneficiaries to Over 70','Support Beyond Tuition','Recognition from Nigerian Law School Leadership','PUSG 2026: Who Can Apply?','Investing in the Future of Nigeria’s Legal Profession'];
body.querySelectorAll('p').forEach(function(p){if(headings.includes(p.textContent)){var h=document.createElement('h2');h.textContent=p.textContent;p.replaceWith(h);}else if(p.textContent===story.sourceUrl){var a=document.createElement('a');a.href=story.sourceUrl;a.className='nir-btn';a.textContent='Visit the official scholarship portal';p.replaceWith(a);}});
var gallery=document.createElement('section');gallery.innerHTML='<h2>In pictures</h2><p>Photographs supplied with this article.</p><div class="pusg-gallery"></div>';var grid=gallery.querySelector('div');for(var i=2;i<=9;i++){var img=document.createElement('img');img.src='images/lawyers-quarters/pusg/0'+i+'.jpg';img.alt=['','', 'Group photograph at a legal ceremony','Conversation with robed legal professionals','Group portrait with legal professionals','Portrait with a certificate holder','Robed attendees reading ceremony programmes','Guests seated at the ceremony','Gift presentation at the ceremony','Handshake on the ceremony stage'][i];img.loading='lazy';img.width=642;img.height=480;grid.append(img);}body.append(gallery);
});
})();
