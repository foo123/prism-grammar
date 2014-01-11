/**
*
*   Classy
*   @version: 0.4.4
*
*   Object-Oriented mini-framework for JavaScript
*   https://github.com/foo123/classy.js
*
**/!function(e,t,r,n,o){r=r?[].concat(r):[];var l,a,i=Array,c=i.prototype,u=r.length,f=new i(u),p=new i(u),s=new i(u);for(l=0;u>l;l++)f[l]=r[l][0],p[l]=r[l][1];if("object"==typeof module&&module.exports){if(o===module.exports[t]){for(l=0;u>l;l++)s[l]=module.exports[f[l]]||require(p[l])[f[l]];a=n.apply(e,s),module.exports[t]=a||1}}else if("function"==typeof define&&define.amd)define(["exports"].concat(p),function(r){if(o===r[t]){for(var l=c.slice.call(arguments,1),i=l.length,u=0;i>u;u++)s[u]=r[f[u]]||l[u];a=n.apply(e,s),r[t]=a||1}});else if(o===e[t]){for(l=0;u>l;l++)s[l]=e[f[l]];a=n.apply(e,s),e[t]=a||1}}(this,"Classy",null,function(){var e={};return function(e){var t=function(e,t,r){this.v=e||null,this.prev=t||null,r=r||null};t.prototype={constructor:t,v:null,prev:null,next:null};var r=Array.prototype,n=Object.prototype,o=r.slice,l=(r.splice,r.concat,n.toString),a=n.hasOwnProperty,i=n.propertyIsEnumerable,c=Object.keys,u=Object.defineProperty,f=function(e){return"function"==typeof e},p=function(e,t){if("object"!=typeof e||null===e)throw new TypeError("bad desc");var r={};if(a.call(e,"enumerable")&&(r.enumerable=!!t.enumerable),a.call(e,"configurable")&&(r.configurable=!!t.configurable),a.call(e,"value")&&(r.value=t.value),a.call(e,"writable")&&(r.writable=!!e.writable),a.call(e,"get")){var n=e.get;if(!f(n)&&"undefined"!==n)throw new TypeError("bad get");r.get=n}if(a.call(e,"set")){var o=e.set;if(!f(o)&&"undefined"!==o)throw new TypeError("bad set");r.set=o}if(("get"in r||"set"in r)&&("value"in r||"writable"in r))throw new TypeError("identity-confused descriptor");return r},s=Object.defineProperties||function(e,t){if("object"!=typeof e||null===e)throw new TypeError("bad obj");t=Object(t);for(var r=c(t),n=[],o=0;o<r.length;o++)n.push([r[o],p(t[r[o]],e)]);for(var o=0;o<n.length;o++)u(e,n[o][0],n[o][1]);return e},b=Object.create||function(e,t){var r,n=function(){};return n.prototype=e,r=new n,r.__proto__=e,"object"==typeof t&&s(r,t),r},y=function(e){var r=new t(e);return function(e){if(e&&r&&r.v){var n,l=this;if(e="constructor"==e?r.v:r.v.prototype[e])return r=new t(r.v.$super,r),n=e.apply(l,o.call(arguments,1)),r=r.prev,n}}},v=function(){var e,t,r,n,c,u,f,p,s=o.call(arguments);for(t=s.shift()||{},e=s.length,p=0;e>p;p++)if(r=s[p],r&&"object"==typeof r)for(f in r)a.call(r,f)&&i.call(r,f)&&(u=r[f],n=l.call(u),c=typeof u,t[f]="number"==c||u instanceof Number?0+u:u&&("[object Array]"==n||u instanceof Array||"string"==c||u instanceof String)?u.slice(0):u);return t},g=function(e,t){e=e||Object,t=t||{};var r=t.constructor?t.constructor:function(){};return r.prototype=b(e.prototype),r.prototype=v(r.prototype,t),s(r.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0},$class:{value:r,enumerable:!1,writable:!0,configurable:!0},$super:{value:y(e),enumerable:!1,writable:!0,configurable:!0}}),s(r,{$super:{value:e,enumerable:!1,writable:!0,configurable:!0},$static:{value:e.$static&&"object"==typeof e.$static?v(null,e.$static):null,enumerable:!1,writable:!0,configurable:!0}}),r},d=Mixin=v,m=function(){var e=o.call(arguments),t=e.length,r=null;if(t>=2){var n=typeof e[0];n="function"==n?{Extends:e[0]}:"object"==n?e[0]:{Extends:Object};var l,a,i=e[1]||{},c=e[2]||null,u={},f=n.Extends||n.extends||Object,p=n.Implements||n.implements,s=n.Mixin||n.mixin;if(p=p?[].concat(p):null,s=s?[].concat(s):null)for(l=0,a=s.length;a>l;l++)s[l].prototype&&(u=Mixin(u,s[l].prototype));if(p)for(l=0,a=p.length;a>l;l++)p[l].prototype&&(u=d(u,p[l].prototype));r=g(f,v(u,i)),c&&"object"==typeof c&&(r.$static=v(r.$static,c))}else r=g(Object,e[0]);return r};e.Classy={VERSION:"0.4.4",Class:m,Extends:g,Implements:d,Mixin:Mixin,Create:b,Merge:v}}(e),e.Classy});
/**
*
*   RegExAnalyzer
*   @version: 0.2.5
*
*   A simple Regular Expression Analyzer in JavaScript
*   https://github.com/foo123/regex-analyzer
*
**/!function(t,e,r,a,p){r=r?[].concat(r):[];var s,h,n=Array,g=n.prototype,i=r.length,o=new n(i),l=new n(i),u=new n(i);for(s=0;i>s;s++)o[s]=r[s][0],l[s]=r[s][1];if("object"==typeof module&&module.exports){if(p===module.exports[e]){for(s=0;i>s;s++)u[s]=module.exports[o[s]]||require(l[s])[o[s]];h=a.apply(t,u),module.exports[e]=h||1}}else if("function"==typeof define&&define.amd)define(["exports"].concat(l),function(r){if(p===r[e]){for(var s=g.slice.call(arguments,1),n=s.length,i=0;n>i;i++)u[i]=r[o[i]]||s[i];h=a.apply(t,u),r[e]=h||1}});else if(p===t[e]){for(s=0;i>s;s++)u[s]=t[o[s]];h=a.apply(t,u),t[e]=h||1}}(this,"RegExAnalyzer",null,function(){var t={};return function(t){var e="\\",r=/^\{\s*(\d+)\s*,?\s*(\d+)?\s*\}/,a=/^u([0-9a-fA-F]{4})/,p=/^x([0-9a-fA-F]{2})/,s={".":"MatchAnyChar","|":"MatchEither","?":"MatchZeroOrOne","*":"MatchZeroOrMore","+":"MatchOneOrMore","^":"MatchStart",$:"MatchEnd","{":"StartRepeats","}":"EndRepeats","(":"StartGroup",")":"EndGroup","[":"StartCharGroup","]":"EndCharGroup"},h={"\\":"EscapeChar","/":"/",0:"NULChar",f:"FormFeed",n:"LineFeed",r:"CarriageReturn",t:"HorizontalTab",v:"VerticalTab",b:"MatchWordBoundary",B:"MatchNonWordBoundary",s:"MatchSpaceChar",S:"MatchNonSpaceChar",w:"MatchWordChar",W:"MatchNonWordChar",d:"MatchDigitChar",D:"MatchNonDigitChar"},n=Object.prototype.toString,g=function(t,e){if(e&&(e instanceof Array||"[object Array]"==n.call(e)))for(var r=0,a=e.length;a>r;r++)t[e[r]]=1;else for(var r in e)t[r]=1;return t},i=function(t,e){t&&(t instanceof Array||"[object Array]"==n.call(t))&&(e=t[1],t=t[0]);var r,a,p=t.charCodeAt(0),s=e.charCodeAt(0);if(s==p)return[String.fromCharCode(p)];for(a=[],r=p;s>=r;++r)a.push(String.fromCharCode(r));return a},o=function(t){var e,r,a,p,s,h,n={},l={};if("Alternation"==t.type)for(a=0,p=t.part.length;p>a;a++)s=o(t.part[a]),n=g(n,s.peek),l=g(l,s.negativepeek);else if("Group"==t.type)s=o(t.part),n=g(n,s.peek),l=g(l,s.negativepeek);else if("Sequence"==t.type){for(a=0,p=t.part.length,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;!h;)s=o(r.part),n=g(n,s.peek),l=g(l,s.negativepeek),a++,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;p>a&&(r=t.part[a],"Special"!=r.type||"^"!=r.part&&"$"!=r.part||(r=t.part[a+1]||null),r&&"Quantifier"==r.type&&(r=r.part),r&&(s=o(r),n=g(n,s.peek),l=g(l,s.negativepeek)))}else if("CharGroup"==t.type)for(e=t.flags.NotMatch?l:n,a=0,p=t.part.length;p>a;a++)r=t.part[a],"Chars"==r.type?e=g(e,r.part):"CharRange"==r.type?e=g(e,i(r.part)):"UnicodeChar"==r.type||"HexChar"==r.type?e[r.flags.Char]=1:"Special"==r.type&&("D"==r.part?t.flags.NotMatch?n["\\d"]=1:l["\\d"]=1:"W"==r.part?t.flags.NotMatch?n["\\w"]=1:l["\\W"]=1:"S"==r.part?t.flags.NotMatch?n["\\s"]=1:l["\\s"]=1:e["\\"+r.part]=1);else"String"==t.type?n[t.part.charAt(0)]=1:"Special"!=t.type||t.flags.MatchStart||t.flags.MatchEnd?("UnicodeChar"==t.type||"HexChar"==t.type)&&(n[t.flags.Char]=1):"D"==t.part?l["\\d"]=1:"W"==t.part?l["\\W"]=1:"S"==t.part?l["\\s"]=1:n["\\"+t.part]=1;return{peek:n,negativepeek:l}},l=function(t,e){t&&this.setRegex(t,e)};l.VERSION="0.2.5",l.getCharRange=i,l.prototype={constructor:l,VERSION:l.VERSION,regex:null,groupIndex:null,pos:null,flags:null,parts:null,getCharRange:l.getCharRange,getPeekChars:function(){var t,e,r,a,p=this.flags&&this.flags.i,h=o(this.parts);for(t in h){a={},r=h[t];for(e in r)"\\d"==e?(delete r[e],a=g(a,i("0","9"))):"\\s"==e?(delete r[e],a=g(a,["\f","\n","\r","	",""," ","\u2028","\u2029"])):"\\w"==e?(delete r[e],a=g(a,["_"].concat(i("0","9")).concat(i("a","z")).concat(i("A","Z")))):"\\."==e?(delete r[e],a[s["."]]=1):"\\"!=e.charAt(0)&&p?(a[e.toLowerCase()]=1,a[e.toUpperCase()]=1):"\\"==e.charAt(0)&&delete r[e];h[t]=g(r,a)}return h},setRegex:function(t,e){if(t){this.flags={},e=e||"/";for(var r=t.toString(),a=r.length,p=r.charAt(a-1);e!=p;)this.flags[p]=1,r=r.substr(0,a-1),a=r.length,p=r.charAt(a-1);e==r.charAt(0)&&e==r.charAt(a-1)&&(r=r.substr(1,a-2)),this.regex=r}return this},analyze:function(){var t,n,g,i="",o=[],l=[],u=!1;for(this.pos=0,this.groupIndex=0;this.pos<this.regex.length;)t=this.regex.charAt(this.pos++),u=e==t?!0:!1,u&&(t=this.regex.charAt(this.pos++)),u?"u"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=a.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"UnicodeChar"})):"x"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=p.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"HexChar"})):h[t]&&"/"!=t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[h[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t:"|"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.push({part:l,flags:{},type:"Sequence"}),l=[]):"["==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.chargroup())):"("==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.subgroup())):"{"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=r.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:l.pop(),flags:{part:g[0],MatchMinimum:g[1],MatchMaximum:g[2]||"unlimited"},type:"Quantifier"})):"*"==t||"+"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):"?"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):s[t]?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t;return i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[s["|"]]=1,this.parts={part:o,flags:n,type:"Alternation"}):this.parts={part:l,flags:{},type:"Sequence"},this},subgroup:function(){var t,n,g,i="",o=[],l=[],u={},f=!1,c=this.regex.substr(this.pos,2);for("?:"==c?(u.NotCaptured=1,this.pos+=2):"?="==c?(u.LookAhead=1,this.pos+=2):"?!"==c&&(u.NegativeLookAhead=1,this.pos+=2),u.GroupIndex=++this.groupIndex;this.pos<this.regex.length;)if(t=this.regex.charAt(this.pos++),f=e==t?!0:!1,f&&(t=this.regex.charAt(this.pos++)),f)"u"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=a.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"UnicodeChar"})):"x"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=p.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"HexChar"})):h[t]&&"/"!=t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[h[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t;else{if(")"==t)return i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[s["|"]]=1,{part:{part:o,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:l,flags:{},type:"Sequence"},flags:u,type:"Group"};"|"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.push({part:l,flags:{},type:"Sequence"}),l=[]):"["==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.chargroup())):"("==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.subgroup())):"{"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=r.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:l.pop(),flags:{part:g[0],MatchMinimum:g[1],MatchMaximum:g[2]||"unlimited"},type:"Quantifier"})):"*"==t||"+"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):"?"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):s[t]?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t}return i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[s["|"]]=1,{part:{part:o,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:l,flags:{},type:"Sequence"},flags:u,type:"Group"}},chargroup:function(){var t,r,s,n,g,i,o=[],l=[],u={},f=!1,c=!1;for("^"==this.regex.charAt(this.pos)&&(u.NotMatch=1,this.pos++);this.pos<this.regex.length;)if(i=!1,s=r,r=this.regex.charAt(this.pos++),c=e==r?!0:!1,c&&(r=this.regex.charAt(this.pos++)),c&&("u"==r?(g=a.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,r=String.fromCharCode(parseInt(g[1],16)),i=!0):"x"==r&&(g=p.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,r=String.fromCharCode(parseInt(g[1],16)),i=!0)),f)l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),n[1]=r,f=!1,o.push({part:n,flags:{},type:"CharRange"});else if(c)!i&&h[r]&&"/"!=r?(l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),t={},t[h[r]]=1,o.push({part:r,flags:t,type:"Special"})):l.push(r);else{if("]"==r)return l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),{part:o,flags:u,type:"CharGroup"};"-"==r?(n=[s,""],l.pop(),f=!0):l.push(r)}return l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),{part:o,flags:u,type:"CharGroup"}}},t.RegExAnalyzer=l}(t),t.RegExAnalyzer});
/**
*
*   PrismGrammar
*   @version: 0.5
*
*   Transform a grammar specification in JSON format, into a syntax-highlighter for Prism
*   https://github.com/foo123/prism-grammar
*
**/!function(t,n,e,i,s){e=e?[].concat(e):[];var r,o,l=Array,h=l.prototype,u=e.length,c=new l(u),a=new l(u),f=new l(u);for(r=0;u>r;r++)c[r]=e[r][0],a[r]=e[r][1];if("object"==typeof module&&module.exports){if(s===module.exports[n]){for(r=0;u>r;r++)f[r]=module.exports[c[r]]||require(a[r])[c[r]];o=i.apply(t,f),module.exports[n]=o||1}}else if("function"==typeof define&&define.amd)define(["exports"].concat(a),function(e){if(s===e[n]){for(var r=h.slice.call(arguments,1),l=r.length,u=0;l>u;u++)f[u]=e[c[u]]||r[u];o=i.apply(t,f),e[n]=o||1}});else if(s===t[n]){for(r=0;u>r;r++)f[r]=t[c[r]];o=i.apply(t,f),t[n]=o||1}}(this,"PrismGrammar",[["Classy","./classy"],["RegExAnalyzer","./regexanalyzer"]],function(t,n){var e,s,r=1/0,o=2,h=4,u=8,c=9,a=10,f=16,p=32,g=64,k=128,d=256,R=512,v=2,y=4,E=8,m=4,b=8,w=16,_=17,x=18,q=32,O=33,A=34,B=64,C=128,S=256,T=257,L=258,j=259,P=512,$=1024,D={ONEOF:B,EITHER:B,ALL:C,ZEROORONE:T,ZEROORMORE:L,ONEORMORE:j,REPEATED:S},M={BLOCK:q,COMMENT:A,ESCAPEDBLOCK:O,SIMPLE:w,GROUP:P,NGRAM:$},I=t.Class,N=Array.prototype,z=Object.prototype,F=N.slice,K=(N.splice,N.concat),G=z.hasOwnProperty,U=z.toString,Z=z.propertyIsEnumerable,H=Object.keys,V=function(t){var n=typeof t,e=U.call(t);return"undefined"==n?d:"number"==n||t instanceof Number?o:null===t?k:!0===t||!1===t?h:t&&("string"==n||t instanceof String)?1==t.length?c:u:t&&("[object RegExp]"==e||t instanceof RegExp)?f:t&&("[object Array]"==e||t instanceof Array)?p:t&&"[object Object]"==e?g:R},J=function(t,n){return n||p!=V(t)?[t]:t},Q=function(t,n){return t=J(t,n),(n||p!=V(t[0]))&&(t=[t]),t},W=function(t){var n,e=V(t);if(!((g|p)&e))return t;var i,s={};for(i in t)G.call(t,i)&&Z.call(t,i)&&(n=V(t[i]),s[i]=g&n?W(t[i]):p&n?t[i].slice():t[i]);return s},X=function(){var t=F.call(arguments),n=t.length;if(1>n)return null;if(2>n)return W(t[0]);var e,i,s,r,o=t.shift(),l=W(o);for(n--,i=0;n>i;i++)if(e=t.shift())for(s in e)G.call(e,s)&&Z.call(e,s)&&(G.call(o,s)&&Z.call(o,s)?(r=V(o[s]),g&~u&r&&(l[s]=X(o[s],e[s]))):l[s]=W(e[s]));return l},Y=function(t){return t.replace(/([.*+?^${}()|[\]\/\\])/g,"\\$1")},tn=function(t,n){var e,i,s,r;for(r=function(t,e){return n[1+parseInt(e,10)]},e=t.split("$$"),s=e.length,i=0;s>i;i++)e[i]=e[i].replace(/\$(\d{1,2})/g,r);return e.join("$")},nn=function(t,n){return n.length-t.length},en=function(t,n){return u&V(n)&&u&V(t)&&n.length&&n.length<=t.length&&n==t.substr(0,n.length)},sn=function(t,e,i){if(!t||o==V(t))return t;var s=e?e.length||0:0;if(s&&e==t.substr(0,s)){var r,l,h,u="^("+t.substr(s)+")";return i[u]||(r=new RegExp(u),h=new n(r).analyze(),l=h.getPeekChars(),H(l.peek).length||(l.peek=null),H(l.negativepeek).length||(l.negativepeek=null),i[u]=[r,l]),i[u]}return t},rn=function(t,n){var e={},i="",s=V(n);(u==s||c==s)&&(i=n);var r=t.sort(nn).map(function(t){return e[t.charAt(0)]=1,Y(t)}).join("|");return[new RegExp("^("+r+")"+i),{peek:e,negativepeek:null},1]},on=I({constructor:function(t){this.string=t?""+t:"",this.start=this.pos=0,this._=null},_:null,string:"",start:0,pos:0,fromStream:function(t){return this._=t,this.string=""+t.string,this.start=t.start,this.pos=t.pos,this},toString:function(){return this.string},sol:function(){return 0==this.pos},eol:function(){return this.pos>=this.string.length},chr:function(t,n){var e=this.string.charAt(this.pos)||null;return e&&t==e?(!1!==n&&(this.pos+=1,this._&&(this._.pos=this.pos)),e):!1},chl:function(t,n){var e=this.string.charAt(this.pos)||null;return e&&-1<t.indexOf(e)?(!1!==n&&(this.pos+=1,this._&&(this._.pos=this.pos)),e):!1},str:function(t,n,e){var i=this.pos,s=this.string,r=s.charAt(i)||null;if(r&&n[r]){var o=t.length,l=s.substr(i,o);if(t==l)return!1!==e&&(this.pos+=o,this._&&(this._.pos=this.pos)),l}return!1},rex:function(t,n,e,i,s){var r=this.pos,o=this.string,l=o.charAt(r)||null;if(l&&n&&n[l]||e&&!e[l]){var h=o.slice(r).match(t);return!h||h.index>0?!1:(!1!==s&&(this.pos+=h[i||0].length,this._&&(this._.pos=this.pos)),h)}return!1},end:function(){return this.pos=this.string.length,this._&&(this._.pos=this.pos),this},nxt:function(){if(this.pos<this.string.length){var t=this.string.charAt(this.pos++)||null;return this._&&(this._.pos=this.pos),t}},bck:function(t){return this.pos-=t,0>this.pos&&(this.pos=0),this._&&(this._.pos=this.pos),this},bck2:function(t){return this.pos=t,0>this.pos&&(this.pos=0),this._&&(this._.pos=this.pos),this},spc:function(){for(var t=this.pos,n=this.pos,e=this.string;/[\s\u00a0]/.test(e.charAt(n));)++n;return this.pos=n,this._&&(this._.pos=this.pos),this.pos>t},cur:function(){return this.string.slice(this.start,this.pos)},sft:function(){return this.start=this.pos,this}}),ln=I({constructor:function(t){this.l=t||0,this.stack=[],this.t=b,this.r="0",this.inBlock=null,this.endBlock=null},l:0,stack:null,t:null,r:null,inBlock:null,endBlock:null,clone:function(){var t=new this.$class(this.l);return t.t=this.t,t.r=this.r,t.stack=this.stack.slice(),t.inBlock=this.inBlock,t.endBlock=this.endBlock,t},toString:function(){return["",this.l,this.t,this.r,this.inBlock||"0",this.stack.length].join("_")}}),hn=I({constructor:function(t,n,e,i){switch(this.type=v,this.tt=t||c,this.tn=n,this.tk=i||0,this.tg=0,this.tp=null,this.p=null,this.np=null,this.tt){case c:case a:this.tp=e;break;case u:this.tp=e,this.p={},this.p[""+e.charAt(0)]=1;break;case f:this.tp=e[0],this.p=e[1].peek||null,this.np=e[1].negativepeek||null,this.tg=e[2]||0;break;case k:this.tp=null}},type:null,tt:null,tn:null,tp:null,tg:0,tk:0,p:null,np:null,get:function(t,n){var e,i=this.tt,s=this.tk,r=this.tp,o=this.tg,l=this.p,h=this.np;switch(i){case c:if(e=t.chr(r,n))return[s,e];break;case a:if(e=t.chl(r,n))return[s,e];break;case u:if(e=t.str(r,l,n))return[s,e];break;case f:if(e=t.rex(r,l,h,o,n))return[s,e];break;case k:return!1!==n&&t.end(),[s,""]}return!1},toString:function(){return["[","Matcher: ",this.tn,", Pattern: ",this.tp?this.tp.toString():null,"]"].join("")}}),un=I(hn,{constructor:function(t,n,e){this.type=y,this.tn=t,this.ms=n,this.ownKey=!1!==e},ms:null,ownKey:!0,get:function(t,n){var e,i,s=this.ms,r=s.length,o=this.ownKey;for(e=0;r>e;e++)if(i=s[e].get(t,n))return o?[e,i[1]]:i;return!1}}),cn=I(hn,{constructor:function(t,n,e){this.type=E,this.tn=t,this.s=new un(this.tn+"_Start",n,!1),this.e=e},s:null,e:null,get:function(t,n){var e,i=this.s,s=this.e;if(e=i.get(t,n)){var r=s[e[0]],l=V(r),h=i.ms[e[0]].tt;return f==h&&(o==l?r=new hn(u,this.tn+"_End",e[1][r+1]):u==l&&(r=new hn(u,this.tn+"_End",tn(r,e[1])))),r}return!1}}),an=function(t,n,e,i){var s=V(n);if(o==s)return n;if(!i[t]){e=e||0;var r,l=0;n&&n.isCharList&&(l=1,delete n.isCharList),r=k&s?new hn(k,t,n,e):c==s?new hn(c,t,n,e):u&s?l?new hn(a,t,n,e):new hn(u,t,n,e):p&s?new hn(f,t,n,e):n,i[t]=r}return i[t]},fn=function(t,n,e,i,s,r){if(!r[t]){var o,l,h,a,f,g,k,d=0,R=0,v=1;if(o=J(n),h=o.length,1==h)k=an(t,sn(o[0],e,s),0,r);else if(h>1){for(a=(h>>1)+1,l=0;a>=l;l++)f=V(o[l]),g=V(o[h-1-l]),(c!=f||c!=g)&&(v=0),p&f||p&g?d=1:(en(o[l],e)||en(o[h-1-l],e))&&(R=1);if(!v||i&&u&V(i))if(!i||d||R){for(l=0;h>l;l++)o[l]=p&V(o[l])?fn(t+"_"+l,o[l],e,i,s,r):an(t+"_"+l,sn(o[l],e,s),l,r);k=h>1?new un(t,o):o[0]}else k=an(t,rn(o,i),0,r);else o=o.slice().join(""),o.isCharList=1,k=an(t,o,0,r)}r[t]=k}return r[t]},pn=function(t,n,e,i,s){if(!s[t]){var r,o,l,h,c,a,p;for(h=[],c=[],r=Q(n),o=0,l=r.length;l>o;o++)a=an(t+"_0_"+o,sn(r[o][0],e,i),o,s),p=r[o].length>1?f!=a.tt||u!=V(r[o][1])||en(r[o][1],e)?an(t+"_1_"+o,sn(r[o][1],e,i),o,s):r[o][1]:a,h.push(a),c.push(p);s[t]=new cn(t,h,c)}return s[t]},gn=I({constructor:function(t,n,e){this.tt=w,this.tn=t,this.t=n,this.r=e,this.required=0,this.ERR=0,this.toClone=["t","r"]},tn:null,tt:null,t:null,r:null,required:0,ERR:0,toClone:null,get:function(t,n){var e=this.t,i=this.tt;if(_==i){if(t.spc(),t.eol())return n.t=b,this.r}else{if(x==i)return this.ERR=this.required&&t.spc()&&!t.eol()?1:0,this.required=0,!1;if(e.get(t))return n.t=this.tt,this.r}return!1},require:function(t){return this.required=t?1:0,this},push:function(t,n,e){return n?t.splice(n,0,e):t.push(e),this},clone:function(){var t,n,e,i=this.toClone;if(t=new this.$class,t.tt=this.tt,t.tn=this.tn,i&&i.length)for(e=i.length,n=0;e>n;n++)t[i[n]]=this[i[n]];return t},toString:function(){return["[","Tokenizer: ",this.tn,", Matcher: ",this.t?this.t.toString():null,"]"].join("")}}),kn=I(gn,{constructor:function(t,n,e,i,s,r,o){this.$super("constructor",n,e,i),this.ri="undefined"==typeof s?this.r:s,this.tt=t,this.mline="undefined"==typeof r?1:r,this.esc=o||"\\",this.toClone=["t","r","ri","mline","esc"]},ri:null,mline:0,esc:null,get:function(t,n){var e,i,s,r,o,l,h,u,c,a=0,f=0,p="",g=this.mline,d=this.t,R=this.tn,v=this.tt,y=this.r,E=this.ri,m=y!=E,b=0,w=O==v,_=this.esc;if(A==v&&(this.required=0),o=0,n.inBlock==R?(f=1,e=n.endBlock,o=1,l=E):!n.inBlock&&(e=d.get(t))&&(f=1,n.inBlock=R,n.endBlock=e,l=y),f){if(s=n.stack.length,r=k==e.tt,m){if(o&&r&&t.sol())return this.required=0,n.inBlock=null,n.endBlock=null,!1;if(!o)return this.push(n.stack,s,this.clone()),n.t=v,l}if(a=e.get(t),i=g,c=0,a)l=r?E:y;else for(u=t.pos;!t.eol();){if(h=t.pos,!(w&&b||!e.get(t))){m?t.pos>h&&h>u?(l=E,t.bck2(h),c=1):(l=y,a=1):(l=y,a=1);break}p=t.nxt(),b=!b&&p==_}return i=g||w&&b,a||!i&&!c?(n.inBlock=null,n.endBlock=null):this.push(n.stack,s,this.clone()),n.t=v,l}return!1}}),dn=I(gn,{constructor:function(t,n,e,i){this.tt=S,this.tn=t||null,this.t=null,this.ts=null,this.min=e||0,this.max=i||r,this.found=0,this.toClone=["ts","min","max","found"],n&&this.set(n)},ts:null,min:0,max:1,found:0,set:function(t){return t&&(this.ts=J(t)),this},get:function(t,n){var e,i,s,r,o,l=this.ts,h=l.length,u=this.found,c=this.min,a=this.max,f=0;for(this.ERR=0,this.required=0,r=t.pos,o=n.stack.length,e=0;h>e;e++){if(i=l[e].clone().require(1),s=i.get(t,n),!1!==s){if(++u,a>=u)return this.found=u,this.push(n.stack,o,this.clone()),this.found=0,s;break}i.required&&f++,i.ERR&&t.bck2(r)}return this.required=c>u,this.ERR=u>a||c>u&&f>0,!1}}),Rn=I(dn,{constructor:function(t,n){this.$super("constructor",t,n,1,1),this.tt=B},get:function(t,n){var e,i,s,r,o=this.ts,l=o.length,h=0,u=0;for(this.required=1,this.ERR=0,r=t.pos,s=0;l>s;s++){if(i=o[s].clone(),e=i.get(t,n),h+=i.required?1:0,!1!==e)return e;i.ERR&&(u++,t.bck2(r))}return this.required=h>0,this.ERR=l==u&&h>0,!1}}),vn=I(dn,{constructor:function(t,n){this.$super("constructor",t,n,1,1),this.tt=C},get:function(t,n){var e,i,s,r,o=this.ts,l=o.length;if(this.required=1,this.ERR=0,s=t.pos,r=n.stack.length,e=o[0].clone().require(1),i=e.get(t,n),!1!==i){for(var h=l-1;h>0;h--)this.push(n.stack,r+l-h-1,o[h].clone().require(1));return i}return e.ERR?(this.ERR=1,t.bck2(s)):e.required&&(this.ERR=1),!1}}),yn=I(dn,{constructor:function(t,n){this.$super("constructor",t,n,1,1),this.tt=$},get:function(t,n){var e,i,s,r,o=this.ts,l=o.length;if(this.required=0,this.ERR=0,s=t.pos,r=n.stack.length,e=o[0].clone().require(0),i=e.get(t,n),!1!==i){for(var h=l-1;h>0;h--)this.push(n.stack,r+l-h-1,o[h].clone().require(1));return i}return e.ERR&&t.bck2(s),!1}}),En=function(t,n,i,s,o,l,h,c,a,f,g){if(null===t){var k=new gn(t,t,e);return k.tt=_,k}if(""===t){var k=new gn(t,t,e);return k.tt=x,k}if(t=""+t,!c[t]){var d,R,v,y,E,m,b,k=null;if(d=i[t]||s[t]||{type:"simple",tokens:t}){if((u|p)&V(d)&&(d={type:"simple",tokens:d}),R=d.type?M[d.type.toUpperCase().replace("-","").replace("_","")]:w,w&R&&""===d.tokens)return k=new gn(t,"",e),k.tt=x,c[t]=k,k;if(d.tokens=J(d.tokens),y=d.action||null,w&R)d.autocomplete&&bn(d,t,g),v="undefined"==typeof d.combine?"\\b":d.combine,k=new gn(t,fn(t,d.tokens.slice(),n,v,l,h),o[t]||e),c[t]=k;else if(q&R)A&R&&mn(d,f),k=new kn(R,t,pn(t,d.tokens.slice(),n,l,h),o[t]||e,o[t+".inside"],d.multiline,d.escape),c[t]=k,d.interleave&&a.push(k.clone());else if(P&R){m=d.tokens.slice(),p&V(d.match)?k=new dn(t,null,d.match[0],d.match[1]):(E=D[d.match.toUpperCase()],k=T==E?new dn(t,null,0,1):L==E?new dn(t,null,0,r):j==E?new dn(t,null,1,r):B&E?new Rn(t,null):new vn(t,null)),c[t]=k,b=[];for(var O=0,C=m.length;C>O;O++)b=b.concat(En(m[O],n,i,s,o,l,h,c,a,f,g));k.set(b)}else if($&R){k=Q(d.tokens.slice()).slice();for(var S,I=[],O=0,C=k.length;C>O;O++)I[O]=k[O].slice(),k[O]=new yn(t+"_NGRAM_"+O,null);c[t]=k;for(var O=0,C=k.length;C>O;O++){S=I[O],b=[];for(var N=0,z=S.length;z>N;N++)b=b.concat(En(S[N],n,i,s,o,l,h,c,a,f,g));k[O].set(b)}}}}return c[t]},mn=function(t,n){var e,s,r,o=Q(t.tokens.slice());for(i=0,l=o.length;l>i;i++)e=o[i][0],s=o[i].length>1?o[i][1]:o[i][0],r=o[i].length>2?o[i][2]:"",null===s?(n.line=n.line||[],n.line.push(e)):(n.block=n.block||[],n.block.push([e,s,r]))},bn=function(t,n,e){var i=[].concat(J(t.tokens)).map(function(t){return{word:t,meta:n}});e.autocomplete=K.apply(e.autocomplete||[],i)},wn=function(t){var n,e,i,s,r,o,l,h,u,c,a,f,g,k,d,R;if(t.__parsed)return t;for(a={},f={},g={},d={},R={},k=[],t=W(t),n=t.RegExpID||null,t.RegExpID=null,delete t.RegExpID,o=t.Lex||{},t.Lex=null,delete t.Lex,l=t.Syntax||{},t.Syntax=null,delete t.Syntax,r=t.Style||{},s=t.Parser||[],i=s.length,e=[],h=0;i>h;h++)u=s[h],c=En(u,n,o,l,r,a,f,g,k,d,R)||null,c&&(p&V(c)?e=e.concat(c):e.push(c));return t.Parser=e,t.cTokens=k,t.Style=r,t.Comments=d,t.Keywords=R,t.__parsed=1,t},_n=I({constructor:function(t,n){this.DEF=n.DEFAULT,this.ERR=n.ERROR,this.Tokens=t.Parser||[],this.cTokens=t.cTokens.length?t.cTokens:null},ERR:null,DEF:null,cTokens:null,Tokens:null,tokenize:function(t){t=t||"";var n,e,i=t.split(/\r\n|\r|\n/g),s=i.length,r=[];for(e={state:new ln,tokens:null},n=0;s>n;n++)e=this.getLineTokens(i[n],e.state,n),r=r.concat(e.tokens),s-1>n&&r.push("\n");return r},getLineTokens:function(t,n){var e,i,s,r,o,l,h,u,c,a,f=this.cTokens,p=this.Tokens,g=p.length,k=this.DEF,d=this.ERR;for(l=[],c=new on(t),a=n.stack,h={type:null,content:""},u=null,a.length&&_==a[a.length-1].tt&&a.pop();!c.eol();)if(i=0,k==u||d==u?(h.type&&l.push(h),l.push(c.cur()),h={type:null,content:""},c.sft()):u&&u!==h.type?(h.type&&l.push(h),h={type:u,content:c.cur()},c.sft()):h.type&&(h.content+=c.cur(),c.sft()),a.length&&x==a[a.length-1].tt||!c.spc()){for(;a.length&&!c.eol();){if(f){for(r=0,s=0;r<f.length;)if(o=f[r++],n.r=u=o.get(c,n),!1!==u){s=1;break}if(s){i=1;break}}if(o=a.pop(),n.r=u=o.get(c,n),!1!==u){i=1;break}if(o.ERR||o.required){a.length=0,c.nxt(),n.t=m,n.r=u=d,i=1;break}}if(!i){if(c.eol())break;for(e=0;g>e;e++){if(o=p[e],n.r=u=o.get(c,n),!1!==u){i=1;break}if(o.ERR||o.required){a.length=0,c.nxt(),n.t=m,n.r=u=d,i=1;break}}if(!i){if(c.eol())break;c.nxt(),n.t=b,n.r=u=k}}}else n.t=b,n.r=u=k;return k==u||d==u?(h.type&&l.push(h),l.push(c.cur())):u&&u!==h.type?(h.type&&l.push(h),l.push({type:u,content:c.cur()})):h.type&&(h.content+=c.cur(),l.push(h)),h=null,{state:n,tokens:l}}}),xn=function(t,n){return new _n(t,n)},qn=function(t){var n={DEFAULT:e,ERROR:s};t=wn(t);var i,r=xn(t,n),o=0,l=null,h={"before-highlight":function(t){l==t.language&&(t._code=t.code,t.code="",t.parser=r)},"before-insert":function(t){l==t.language&&(t.code=t._code,t._code="",t.highlightedCode=i.Token.stringify(t.parser.tokenize(t.code),t.language))}};return{hook:function(t,n){if(!o){i=t,l=n;for(var e in h)i.hooks.add(e,h[e]);o=1}},unhook:function(){if(o){var t=i.hooks.all;for(var n in h)if(t[n]){var e=t[n].indexOf(h[n]);e>-1&&t[n].splice(e,1)}o=0}}}};return e="",s="",PrismGrammar={VERSION:"0.5",extend:X,parse:wn,getMode:qn}});
