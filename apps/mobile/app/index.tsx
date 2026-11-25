import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { calculateBaskets, formatGBP, products, retailers } from '@trolleyscout/core';

type Quantities = Record<string, number>;
type Tab = 'discover' | 'list' | 'compare' | 'you';
type Store = ReturnType<typeof calculateBaskets>[number];
type Product = (typeof products)[number];
type Palette = typeof light;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const STORE_KEY = '@trolleyscout/mobile/v1';
const light = {
  bg:'#F5F8F3', card:'#FFFFFF', text:'#173E2F', sub:'#728678', line:'#DEE8DD',
  green:'#174E39', rich:'#123B2C', accent:'#D8F5AE', pale:'#E7F3E8',
  overlay:'rgba(255,255,255,0.86)', icon:'#3D8A62', glass:'rgba(255,255,255,0.80)'
};
const dark = {
  bg:'#091D16', card:'#153428', text:'#F5FAF5', sub:'#B0C6B7', line:'#355044',
  green:'#28744F', rich:'#0F2F23', accent:'#D8F5AE', pale:'#204331',
  overlay:'rgba(20,48,36,0.9)', icon:'#A1D9AA', glass:'rgba(20,47,36,0.85)'
};
const categories = [
  {label:'All', icon:'grid-outline' as IconName},
  {label:'Dairy', icon:'water-outline' as IconName},
  {label:'Bakery', icon:'restaurant-outline' as IconName},
  {label:'Fruit & veg', icon:'leaf-outline' as IconName},
  {label:'Pantry', icon:'basket-outline' as IconName},
];
const categoryOf = (id:string) => ['milk','eggs','butter'].includes(id)?'Dairy':id==='bread'?'Bakery':['bananas','tomatoes','apples'].includes(id)?'Fruit & veg':'Pantry';

function App() {
  const [basket,setBasket]=useState<Quantities>({milk:1,bread:1,eggs:1,bananas:1,pasta:1});
  const [postcode,setPostcode]=useState('');
  const [favourites,setFavourites]=useState<string[]>([]);
  const [tab,setTab]=useState<Tab>('discover');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All');
  const [selectedStore,setSelectedStore]=useState<Store|null>(null);
  const [selectedProduct,setSelectedProduct]=useState<Product|null>(null);
  const [ready,setReady]=useState(false);
  const [welcome,setWelcome]=useState(false);
  const [darkMode,setDarkMode]=useState(false);
  const [info,setInfo]=useState(false);
  const c:Palette=darkMode?dark:light;
  const {width}=useWindowDimensions();
  const insets=useSafeAreaInsets();
  const tablet=width>=760;
  const quantities=useMemo(()=>Object.values(basket).reduce((a,b)=>a+b,0),[basket]);
  const results=useMemo(()=>calculateBaskets(basket),[basket]);
  const complete=results.filter(s=>s.complete);
  const cheapest=complete[0];
  const mostExpensive=complete[complete.length-1];
  const saving=cheapest && mostExpensive ? mostExpensive.totalPence-cheapest.totalPence : 0;

  useEffect(()=>{
    let active=true;
    AsyncStorage.getItem(STORE_KEY).then(raw=>{
      if (!active) return;
      if (raw) {
        const saved=JSON.parse(raw);
        if(saved.basket && typeof saved.basket==='object') {
          const valid:Quantities={};
          products.forEach(p=>{const q=saved.basket[p.id];if(Number.isInteger(q)&&q>0&&q<=99)valid[p.id]=q;});
          setBasket(valid);
        }
        if(typeof saved.postcode==='string')setPostcode(saved.postcode.slice(0,10));
        if(Array.isArray(saved.favourites))setFavourites(saved.favourites.filter((id:unknown)=>typeof id==='string'&&products.some(p=>p.id===id)));
        if(typeof saved.darkMode==='boolean')setDarkMode(saved.darkMode);
      }else setWelcome(true);
    }).catch(()=>{}).finally(()=>{if(active)setReady(true);});
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{if(ready)AsyncStorage.setItem(STORE_KEY,JSON.stringify({basket,postcode,favourites,darkMode})).catch(()=>{});},[basket,postcode,favourites,darkMode,ready]);

  const adjust=useCallback((id:string,delta:number)=>{setBasket(old=>{
    const next={...old};const quantity=Math.min(99,Math.max(0,(old[id]||0)+delta));
    if(quantity)next[id]=quantity;else delete next[id];return next;
  });},[]);
  const toggleFavourite=(id:string)=>setFavourites(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
  const go=(next:Tab)=>{Keyboard.dismiss();setTab(next);setSearch('');};

  const t=(text:string,size:number=15,bold:boolean=false,color?:string,extra?:object)=><Text style={[{color:color||c.text,fontSize:size,fontWeight:bold?'700':'400'},extra]}>{text}</Text>;
  const icon=(name:IconName,size=22,color=c.text)=><Ionicons name={name} size={size} color={color}/>;
  const caption=(text:string)=><Text style={{fontSize:11,letterSpacing:1.7,fontWeight:'800',color:c.icon}}>{text.toUpperCase()}</Text>;
  const pill=(text:string,selected=false,onPress?:()=>void,iconName?:IconName)=><Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{selected}} style={[s.pill,{backgroundColor:selected?c.green:c.card,borderColor:selected?c.green:c.line}]}>
    {iconName&&icon(iconName,15,selected?'#FFF':c.icon)}{t(text,13,true,selected?'#FFF':c.text)}
  </Pressable>;
  const primary=(label:string,onPress:()=>void,disabled=false,secondary=false)=><Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{disabled}} style={[s.primary,{backgroundColor:secondary?c.pale:c.green,opacity:disabled ? 0.45 : 1}]}>
    {t(label,15,true,secondary?c.text:'#FFF')}{icon('arrow-forward',18,secondary?c.text:'#FFF')}
  </Pressable>;
  const productRow=(p:Product)=>{
    const count=basket[p.id]||0;const fav=favourites.includes(p.id);
    return <View key={p.id} style={[s.productRow,{backgroundColor:c.card,borderColor:c.line}]}>
      <Pressable onPress={()=>setSelectedProduct(p)} accessibilityRole="button" accessibilityLabel={'View '+p.name+' comparison'} style={{flexDirection:'row',alignItems:'center',gap:12,flex:1,minWidth:0}}>
        <View style={[s.productIcon,{backgroundColor:c.pale}]}>{t(p.emoji,27)}</View>
        <View style={{flexShrink:1}}>{t(p.name,14,true)}{t(p.detail,12,false,c.sub,{marginTop:4})}</View>
      </Pressable>
      <View style={s.stepper}>
        <Pressable style={[s.step,{backgroundColor:c.pale}]} onPress={()=>adjust(p.id,-1)} accessibilityRole="button" accessibilityLabel={'Remove one '+p.name}>{icon('remove',16,c.text)}</Pressable>
        {t(String(count),14,true,undefined,{minWidth:15,textAlign:'center'})}
        <Pressable style={[s.step,{backgroundColor:c.pale}]} onPress={()=>adjust(p.id,1)} accessibilityRole="button" accessibilityLabel={'Add one '+p.name}>{icon('add',16,c.text)}</Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={fav?'Remove favourite':'Add favourite'} onPress={()=>toggleFavourite(p.id)} style={{padding:4}}>{icon(fav?'heart':'heart-outline',18,fav?'#E06C73':c.sub)}</Pressable>
    </View>;
  };
  const title=(overline:string,heading:string,body:string)=><View style={{marginBottom:23}}>{caption(overline)}<Text style={[s.heading,{color:c.text,fontSize:tablet?48:37,lineHeight:tablet?54:42}]}>{heading}</Text>{t(body,15,false,c.sub,{lineHeight:23})}</View>;
  const disclaimer=<Text style={[s.disclaimer,{color:c.sub}]}>DEMONSTRATION ONLY · All prices are fictional and are not current retailer offers. Pack equivalence, stock, loyalty prices and location have not been verified.</Text>;

  function Discover(){
    const visible=products.filter(p=>(category==='All'||categoryOf(p.id)===category)&&p.name.toLowerCase().includes(search.trim().toLowerCase()));
    return <>
      {title('YOUR SHOPPING COMPANION','Spend less.\nEnjoy more.','One list. A clearer way to compare your everyday essentials.')}
      <LinearGradient colors={['#194C39','#287951','#426F4B']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.hero}>
        <View style={{position:'absolute',right:-54,top:-70,width:210,height:210,borderRadius:110,backgroundColor:'#FFFFFF12'}}/>
        <View style={{position:'absolute',right:20,bottom:-70,width:140,height:140,borderRadius:80,backgroundColor:'#E4FFBA12'}}/>
        <Text style={s.heroLabel}>YOUR WEEKLY BASKET</Text>
        <Text style={s.heroTitle}>{quantities} essentials.\nOne smart move.</Text>
        <Text style={[s.heroDescription,{marginBottom:21}]}>Compare illustrative prices across eight UK supermarkets.</Text>
        <Pressable onPress={()=>go('compare')} accessibilityRole="button" style={[s.heroAction,{backgroundColor:c.accent}]}>{t('Compare my basket',14,true,'#173E2F')}{icon('arrow-forward',19,'#173E2F')}</Pressable>
      </LinearGradient>
      <View style={s.sectionHeading}>{t('Everyday essentials',22,true)}{t(products.length+' products',12,false,c.sub)}</View>
      <View style={[s.searchBox,{backgroundColor:c.card,borderColor:c.line}]}>{icon('search-outline',21,c.sub)}
        <TextInput value={search} onChangeText={setSearch} placeholder="Search groceries" placeholderTextColor={c.sub} style={{flex:1,fontSize:15,color:c.text}} accessibilityLabel="Search grocery products" autoCorrect={false}/>
        {!!search&&<Pressable onPress={()=>setSearch('')}>{icon('close-circle',18,c.sub)}</Pressable>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:13}}>{categories.map(cat=><React.Fragment key={cat.label}>{pill(cat.label,category===cat.label,()=>setCategory(cat.label),cat.icon)}</React.Fragment>)}</ScrollView>
      {visible.length?visible.map(productRow):<View style={{padding:30,alignItems:'center'}}>{t('No products found',16,true)}</View>}
      {disclaimer}
    </>;
  }
  function List(){
    const chosen=products.filter(p=>(basket[p.id]||0)>0);
    return <>
      {title('YOUR WEEKLY ESSENTIALS','Your list.','A beautifully simple list that stays on this device.')}
      <View style={[s.summary,{backgroundColor:c.pale}]}><View>{caption('IN YOUR TROLLEY')}{t(quantities+' items',30,true,undefined,{marginTop:6})}</View>{icon('bag-handle-outline',35,c.icon)}</View>
      {chosen.length?chosen.map(productRow):<View style={[s.empty,{backgroundColor:c.card}]}>{icon('basket-outline',42,c.icon)}{t('Your trolley is empty',20,true)}{t('Add a few essentials to get started.',14,false,c.sub)}{primary('Browse products',()=>go('discover'))}</View>}
      {chosen.length>0&&<>{primary('Compare my list',()=>go('compare'))}<Pressable style={{alignSelf:'center',marginTop:24}} onPress={()=>Alert.alert('Clear shopping list?','This will remove every item from your list.',[{text:'Cancel',style:'cancel'},{text:'Clear list',style:'destructive',onPress:()=>setBasket({})}])}>{t('Clear my list',13,true,c.sub)}</Pressable></>}
      {disclaimer}
    </>;
  }
  function Compare(){
    return <>
      {title('SMART BASKET COMPARISON','Compare stores.','See complete demo baskets first, with unavailable products clearly marked.')}
      {cheapest?<LinearGradient colors={['#113C2D','#227047']} style={s.hero}>
        <Text style={s.heroLabel}>LOWEST COMPLETE EXAMPLE BASKET</Text>
        <Text style={[s.heroTitle,{fontSize:52,lineHeight:60,marginTop:10}]}>{formatGBP(cheapest.totalPence)}</Text>
        {t(cheapest.name+' · '+cheapest.matched+' of '+cheapest.required+' products',14,true,'#D5F5DA',{marginBottom:14})}
        {saving>0?<View style={s.saving}>{icon('sparkles-outline',15,'#183D2D')}{t('Example spread of '+formatGBP(saving),13,true,'#183D2D')}</View>:null}
      </LinearGradient>:<View style={[s.empty,{backgroundColor:c.card}]}>{icon('stats-chart-outline',40,c.icon)}{t('No complete basket available',19,true)}{t(quantities?'Some products are missing at selected stores.':'Add essentials to compare supermarkets.',14,false,c.sub)}{primary('Edit shopping list',()=>go('list'))}</View>}
      <View style={s.sectionHeading}>{t('Retailer ranking',22,true)}{t(complete.length+' complete',12,false,c.sub)}</View>
      {results.map((store,index)=><Pressable onPress={()=>setSelectedStore(store)} key={store.id} accessibilityRole="button" accessibilityLabel={'View '+store.name+' basket breakdown'} style={[s.storeRow,{backgroundColor:c.card,borderColor:index===0&&store.complete?'#79BC84':c.line}]}>
        <View style={[s.storeBadge,{backgroundColor:store.complete?c.pale:c.bg}]}>{t(store.name.slice(0,1).toUpperCase(),19,true,c.icon)}</View>
        <View style={{flex:1}}>{t(store.name,16,true)}{t(store.matched+' / '+store.required+' matched'+(store.complete?'':' · incomplete'),12,false,c.sub,{marginTop:5})}</View>
        <View style={{alignItems:'flex-end'}}>{t(formatGBP(store.totalPence),20,true)}{!store.complete&&t('Partial total',11,false,'#BF7737')}</View>{icon('chevron-forward',17,c.sub)}
      </Pressable>)}
      <Pressable style={{alignSelf:'center',marginTop:18,padding:9}} onPress={()=>setInfo(true)}>{t('How do we compare baskets?',13,true,c.icon)}</Pressable>
      {disclaimer}
    </>;
  }
  function You(){
    return <>
      {title('YOUR TROLLEYSCOUT','Made for you.','Your preferences, saved locally on your device.')}
      <View style={[s.settings,{backgroundColor:c.card,borderColor:c.line}]}>
        <View style={s.settingItem}>{icon('location-outline',24,c.icon)}<View style={{flex:1}}>{t('Shopping postcode',15,true)}{t('Not used for live prices yet',12,false,c.sub,{marginTop:4})}</View></View>
        <TextInput value={postcode} onChangeText={setPostcode} maxLength={10} autoCapitalize="characters" autoCorrect={false} placeholder="e.g. B67 7BX" placeholderTextColor={c.sub} style={[s.postcode,{backgroundColor:c.bg,color:c.text,borderColor:c.line}]} accessibilityLabel="Shopping postcode"/>
        <View style={[s.divider,{backgroundColor:c.line}]}/>
        <View style={s.settingItem}>{icon('moon-outline',24,c.icon)}<View style={{flex:1}}>{t('Dark appearance',15,true)}{t('Choose your preferred theme',12,false,c.sub,{marginTop:4})}</View><Switch value={darkMode} onValueChange={setDarkMode} trackColor={{true:'#428F61'}}/></View>
        <View style={[s.divider,{backgroundColor:c.line}]}/>
        <View style={s.settingItem}>{icon('heart-outline',24,c.icon)}<View style={{flex:1}}>{t('Favourite products',15,true)}{t(favourites.length+' saved favourites',12,false,c.sub,{marginTop:4})}</View></View>
        {products.filter(p=>favourites.includes(p.id)).map(productRow)}
      </View>
      <View style={[s.membership,{backgroundColor:c.pale}]}>{caption('A FUTURE POSSIBILITY')}{t('One penny. Big ideas.',27,true,undefined,{marginTop:10})}{t('Membership and payments are not active. No charges can be made in this prototype.',14,false,c.sub,{lineHeight:22,marginTop:8})}</View>
      {disclaimer}
    </>;
  }
  function GlassNav(){
    const entries:{key:Tab;label:string;symbol:IconName}[]=[
      {key:'discover',label:'Explore',symbol:'compass-outline'},
      {key:'list',label:'My list',symbol:'list-outline'},
      {key:'compare',label:'Compare',symbol:'bar-chart-outline'},
      {key:'you',label:'You',symbol:'person-outline'}
    ];
    return <View style={[s.navOuter,tablet?{position:'relative',width:110,height:'100%',paddingTop:insets.top+35,paddingBottom:insets.bottom+24,justifyContent:'center'}:{left:16,right:16,bottom:Math.max(insets.bottom,12)+7}]}>
      <BlurView intensity={Platform.OS==='ios'?70:0} tint={darkMode?'dark':'light'} style={[s.navGlass,{backgroundColor:c.glass,flexDirection:tablet?'column':'row',paddingVertical:tablet?20:9}]}>
        {entries.map(entry=><Pressable key={entry.key} onPress={()=>go(entry.key)} accessibilityRole="tab" accessibilityState={{selected:tab===entry.key}} style={[s.navButton,tablet&&{height:90},tab===entry.key&&{backgroundColor:c.pale}]}>
          {icon(entry.symbol,23,tab===entry.key?c.icon:c.sub)}
          <Text style={{fontSize:11,fontWeight:tab===entry.key?'800':'600',color:tab===entry.key?c.text:c.sub,marginTop:5}}>{entry.label}</Text>
          {entry.key==='list'&&quantities>0&&<View style={s.navBadge}><Text style={{color:'#FFF',fontSize:9,fontWeight:'800'}}>{quantities>99?'99+':quantities}</Text></View>}
        </Pressable>)}
      </BlurView>
    </View>;
  }
  if(!ready)return <View style={[s.loader,{backgroundColor:c.bg}]}><ActivityIndicator color={c.icon} size="large"/></View>;
  return <View style={[s.root,{backgroundColor:c.bg,flexDirection:tablet?'row':'column'}]}>
    <StatusBar style={darkMode?'light':'dark'}/>
    {tablet&&<GlassNav/>}
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.page,{width:'100%',maxWidth:tablet?980:600,paddingTop:Math.max(insets.top,24)+20,paddingBottom:tablet?60:150,paddingHorizontal:tablet?50:20}]} style={{flex:1}} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Text style={[s.logo,{color:c.text}]}>trolleyscout<Text style={{color:'#55AD72'}}>.</Text></Text><View style={[s.demoTag,{backgroundColor:c.pale}]}>{t('●  EARLY PREVIEW',10,true,c.icon)}</View></View>
      {tab==='discover'?Discover():tab==='list'?List():tab==='compare'?Compare():You()}
    </ScrollView>
    {!tablet&&<GlassNav/>}
    <Modal visible={!!selectedStore} animationType="slide" transparent onRequestClose={()=>setSelectedStore(null)}>
      <View style={s.modalOverlay}><Pressable style={{flex:1}} onPress={()=>setSelectedStore(null)}/>
        <View style={[s.sheet,{backgroundColor:c.card,paddingBottom:Math.max(insets.bottom,22)+14}]}>
          <View style={s.sheetTop}><View>{caption('BASKET BREAKDOWN')}{t(selectedStore?.name||'',30,true,undefined,{marginTop:6})}</View><Pressable onPress={()=>setSelectedStore(null)} style={[s.close,{backgroundColor:c.pale}]}>{icon('close',22,c.text)}</Pressable></View>
          <ScrollView style={{maxHeight:380}}>{selectedStore&&products.filter(p=>basket[p.id]).map(p=>{
            const index=retailers.findIndex(r=>r.id===selectedStore.id);
            const price=p.prices[index];
            return <View key={p.id} style={[s.breakdown,{borderBottomColor:c.line}]}><Text style={{fontSize:25}}>{p.emoji}</Text><View style={{flex:1}}>{t(p.name,14,true)}{t((basket[p.id]||0)+' × '+p.detail,12,false,c.sub)}</View>{t(typeof price==='number'?formatGBP(price*(basket[p.id]||0)):'Unavailable',14,true,typeof price==='number'?c.text:'#BC7C39')}</View>;
          })}</ScrollView>
          <View style={{marginTop:17}}>{t(selectedStore?'Matched items total: '+formatGBP(selectedStore.totalPence):'',23,true)}{selectedStore&&!selectedStore.complete&&t('Incomplete basket — not a comparable final total.',12,false,'#BC7C39',{marginTop:5})}</View>
          {disclaimer}
        </View>
      </View>
    </Modal>
    <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={()=>setSelectedProduct(null)}><View style={s.modalOverlay}><Pressable style={{flex:1}} onPress={()=>setSelectedProduct(null)}/><View style={[s.sheet,{backgroundColor:c.card,paddingBottom:Math.max(insets.bottom,22)+14}]}>
      <View style={s.sheetTop}><View style={{flex:1}}>{caption('PRODUCT COMPARISON')}{t(selectedProduct?.name||'',25,true,undefined,{marginTop:7})}{t(selectedProduct?.detail||'',13,false,c.sub,{marginTop:5})}</View><Pressable onPress={()=>setSelectedProduct(null)} style={[s.close,{backgroundColor:c.pale}]}>{icon('close',22,c.text)}</Pressable></View>
      <ScrollView style={{maxHeight:390}}>{selectedProduct&&retailers.map((r,i)=><View key={r.id} style={[s.breakdown,{borderBottomColor:c.line}]}><View style={[s.storeBadge,{backgroundColor:c.pale}]}>{t(r.name.slice(0,1),17,true,c.icon)}</View><View style={{flex:1}}>{t(r.name,15,true)}</View>{t(typeof selectedProduct.prices[i]==='number'?formatGBP(selectedProduct.prices[i] as number):'Unavailable',16,true)}</View>)}</ScrollView>
      {selectedProduct&&primary('Add one to my list',()=>{adjust(selectedProduct.id,1);setSelectedProduct(null);})}{disclaimer}
    </View></View></Modal>
    <Modal visible={info} transparent animationType="fade" onRequestClose={()=>setInfo(false)}><View style={s.modalOverlay}><Pressable style={{flex:1}} onPress={()=>setInfo(false)}/><View style={[s.sheet,{backgroundColor:c.card,paddingBottom:Math.max(insets.bottom,22)+14}]}><View style={s.sheetTop}>{t('How basket totals work',24,true)}<Pressable onPress={()=>setInfo(false)} style={[s.close,{backgroundColor:c.pale}]}>{icon('close',22,c.text)}</Pressable></View>{t('We multiply each example item price by the quantity in your list, then add them in whole pennies. A store ranks as complete only when every selected product has a price. Incomplete stores display partial totals separately.',15,false,c.sub,{lineHeight:24})}{primary('Got it',()=>setInfo(false))}</View></View></Modal>
    <Modal visible={welcome} transparent animationType="fade" onRequestClose={()=>setWelcome(false)}><View style={s.welcomeOverlay}><View style={[s.welcomeCard,{backgroundColor:c.card}]}><View style={[s.welcomeIcon,{backgroundColor:c.pale}]}>{icon('basket-outline',40,c.icon)}</View>{caption('WELCOME TO TROLLEYSCOUT')}{t('Good shopping starts here.',30,true,undefined,{textAlign:'center',lineHeight:36,marginTop:15})}{t('Add essentials, compare fictional supermarket prices, and explore how your weekly shop could work. No account needed for this early demo.',14,false,c.sub,{lineHeight:22,textAlign:'center',marginTop:12,marginBottom:20})}{primary('Start exploring',()=>setWelcome(false))}</View></View></Modal>
  </View>;
}
export default function Main(){return <SafeAreaProvider><App/></SafeAreaProvider>}

const s=StyleSheet.create({
  root:{flex:1},loader:{flex:1,alignItems:'center',justifyContent:'center'},
  page:{alignSelf:'center'},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:37},
  logo:{fontSize:26,letterSpacing:-1.5,fontWeight:'900'},demoTag:{borderRadius:22,paddingHorizontal:12,paddingVertical:9},
  heading:{fontWeight:'900',letterSpacing:-2,marginTop:11,marginBottom:14},
  hero:{borderRadius:29,padding:26,minHeight:236,overflow:'hidden',marginBottom:27},
  heroLabel:{color:'#BBEFC8',fontSize:11,fontWeight:'800',letterSpacing:1.7},
  heroTitle:{color:'#FFFFFF',fontWeight:'900',fontSize:31,lineHeight:37,letterSpacing:-1.2,marginTop:15},
  heroDescription:{color:'#D3EBDD',fontSize:13,lineHeight:20,marginTop:9},
  heroAction:{alignSelf:'flex-start',flexDirection:'row',gap:14,alignItems:'center',paddingHorizontal:17,paddingVertical:12,borderRadius:28},
  sectionHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  searchBox:{borderRadius:17,borderWidth:1,paddingHorizontal:16,height:56,flexDirection:'row',alignItems:'center',gap:11},
  pill:{flexDirection:'row',alignItems:'center',gap:7,borderRadius:30,borderWidth:1,paddingHorizontal:15,paddingVertical:12},
  productRow:{borderWidth:1,borderRadius:20,paddingHorizontal:12,paddingVertical:13,flexDirection:'row',alignItems:'center',gap:10,marginBottom:9},
  productIcon:{width:49,height:49,borderRadius:15,alignItems:'center',justifyContent:'center'},
  stepper:{flexDirection:'row',alignItems:'center',gap:9},step:{width:29,height:32,borderRadius:11,justifyContent:'center',alignItems:'center'},
  primary:{marginTop:19,alignSelf:'stretch',minHeight:54,borderRadius:19,paddingHorizontal:19,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  summary:{borderRadius:23,padding:23,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:20},
  empty:{borderRadius:22,padding:32,alignItems:'center',gap:13,marginVertical:17},
  storeRow:{borderRadius:19,borderWidth:1,padding:13,flexDirection:'row',alignItems:'center',gap:13,marginBottom:9},
  storeBadge:{height:47,width:47,borderRadius:15,alignItems:'center',justifyContent:'center'},
  saving:{alignSelf:'flex-start',marginTop:9,paddingVertical:9,paddingHorizontal:13,borderRadius:20,flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'#D8F5AE'},
  settings:{borderWidth:1,borderRadius:23,padding:18},settingItem:{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:11},
  postcode:{borderWidth:1,borderRadius:13,padding:14,fontSize:16,marginBottom:12,marginTop:8},
  divider:{height:1,marginVertical:12},membership:{marginTop:22,padding:25,borderRadius:23},
  disclaimer:{marginTop:24,fontSize:10,lineHeight:17,letterSpacing:.2},
  navOuter:{position:'absolute',zIndex:10},navGlass:{borderRadius:31,overflow:'hidden',borderWidth:1,borderColor:'#FFFFFF70',justifyContent:'space-around',shadowColor:'#153A28',shadowOffset:{width:0,height:13},shadowOpacity:.12,shadowRadius:25,elevation:7},
  navButton:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:11,borderRadius:23,marginHorizontal:3,minHeight:57},
  navBadge:{position:'absolute',right:10,top:3,minWidth:17,height:17,backgroundColor:'#2C9258',borderRadius:9,justifyContent:'center',alignItems:'center',paddingHorizontal:3},
  modalOverlay:{flex:1,backgroundColor:'#0007',justifyContent:'flex-end'},sheet:{borderTopLeftRadius:32,borderTopRightRadius:32,padding:24},
  sheetTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:20},
  close:{height:36,width:36,borderRadius:19,alignItems:'center',justifyContent:'center'},
  breakdown:{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:13,borderBottomWidth:1},
  welcomeOverlay:{flex:1,backgroundColor:'#051B1299',justifyContent:'center',padding:23},
  welcomeCard:{borderRadius:32,padding:29,alignItems:'center',maxWidth:470,alignSelf:'center',width:'100%'},
  welcomeIcon:{width:76,height:76,borderRadius:23,alignItems:'center',justifyContent:'center',marginBottom:17}
});
