#!/usr/bin/env python3
"""Reduce PostgreSQL CSVLOG a JSONL; nunca conserva consultas ni datos de conexión."""
import csv,datetime,json,sys

def iso(value):
 try:
  parsed=datetime.datetime.fromisoformat(value.replace(' ','T',1))
  if parsed.tzinfo is None:parsed=parsed.replace(tzinfo=datetime.timezone.utc)
  return parsed.astimezone(datetime.timezone.utc).isoformat().replace('+00:00','Z')
 except Exception:return None

reader=csv.reader(sys.stdin)
first=next(reader,None)
if first is None:raise SystemExit(0)
# PostgreSQL CSVLOG has a fixed field order and normally no header.
if len(first)>=15 and first[0].lower() not in {'timestamp','log_time'}:
 rows=[first]
 for row in rows:
  stamp=iso(row[0]);severity=row[11] or 'LOG';tag=row[7] or 'event'
  event='postgres_'+''.join(ch.lower() if ch.isalnum() else '_' for ch in tag)[:70].strip('_')
  print(json.dumps({'timestamp':stamp,'source':'database','event':event,'status':severity,'duration_ms':None},ensure_ascii=False))
 for row in reader:
  if len(row)<15:continue
  stamp=iso(row[0]);severity=row[11] or 'LOG';tag=row[7] or 'event'
  event='postgres_'+''.join(ch.lower() if ch.isalnum() else '_' for ch in tag)[:70].strip('_')
  print(json.dumps({'timestamp':stamp,'source':'database','event':event,'status':severity,'duration_ms':None},ensure_ascii=False))
else:
 # Supabase Logs CSV exports can have a provider-specific schema. Use only
 # timestamp and a severity field when present; never copy the message column.
 header=[x.strip().lower() for x in first]
 if 'timestamp' not in header and 'log_time' not in header:
  raise SystemExit('CSV no reconocido: se requiere CSVLOG PostgreSQL estándar o encabezado timestamp/log_time.')
 time_key='timestamp' if 'timestamp' in header else 'log_time'
 severity_key=next((k for k in ('level','severity','error_severity') if k in header),None)
 for row in reader:
  data={header[i]:row[i] for i in range(min(len(header),len(row)))}
  severity=data.get(severity_key,'observed') if severity_key else 'observed'
  stamp=iso(data.get(time_key,''))
  print(json.dumps({'timestamp':stamp,'source':'database','event':'postgres_log','status':severity or 'observed','duration_ms':None},ensure_ascii=False))
