#!/usr/bin/env python3
"""Normaliza access logs de Tomcat y Nginx a JSONL sin IP, query string ni agente."""
import csv,datetime,json,re,sys
TOMCAT=re.compile(r'^\[([^]]+)\]\s+(\S+)\s+(\S+)\s+(HTTP/[^ ]+)\s+(\d{3})\s+(\S+)\s+(\d+)$')
NGINX=re.compile(r'^\S+\s+\S+\s+\S+\s+\[([^]]+)\]\s+"(\S+)\s+(\S+)\s+([^"]+)"\s+(\d{3})\s+(\S+)')
def iso(v):
 for fmt in ('%d/%b/%Y:%H:%M:%S %z','%d/%b/%Y:%H:%M:%S %z'):
  try:return datetime.datetime.strptime(v,fmt).isoformat()
  except ValueError:pass
 return None
for line in sys.stdin:
 line=line.rstrip('\n');m=TOMCAT.match(line)
 if m:
  ts,method,path,proto,status,size,duration=m.groups();item={'timestamp':iso(ts),'source':'server','event':method+' '+path,'status':status,'duration_ms':round(int(duration)/1000) if duration.isdigit() else None}
 else:
  m=NGINX.match(line)
  if not m:continue
  ts,method,path,proto,status,size=m.groups(); item={'timestamp':iso(ts),'source':'server','event':method+' '+path.split('?',1)[0],'status':status,'duration_ms':None}
 print(json.dumps(item,ensure_ascii=False))
