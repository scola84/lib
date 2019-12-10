const list = [
  'ABS',
  'ACOS',
  'ADDDATE',
  'ADDTIME',
  'AES_DECRYPT',
  'AES_ENCRYPT',
  'ANY_VALUE',
  'AREA',
  'ASBINARY',
  'ASCII',
  'ASIN',
  'ASTEXT',
  'ASYMMETRIC_DECRYPT',
  'ASYMMETRIC_DERIVE',
  'ASYMMETRIC_ENCRYPT',
  'ASYMMETRIC_SIGN',
  'ASYMMETRIC_VERIFY',
  'ATAN',
  'ATAN2',
  'AVG',
  'BENCHMARK',
  'BIN',
  'BINARY',
  'BIT_AND',
  'BIT_COUNT',
  'BIT_LENGTH',
  'BIT_OR',
  'BIT_XOR',
  'BUFFER',
  'CAST',
  'CEIL',
  'CEILING',
  'CENTROID',
  'CHAR',
  'CHARACTER_LENGTH',
  'CHARSET',
  'CHAR_LENGTH',
  'COALESCE',
  'COERCIBILITY',
  'COLLATION',
  'COMPRESS',
  'CONCAT',
  'CONCAT_WS',
  'CONNECTION_ID',
  'CONTAINS',
  'CONV',
  'CONVERT',
  'CONVERT_TZ',
  'CONVEXHULL',
  'COS',
  'COT',
  'COUNT',
  'CRC32',
  'CREATE_ASYMMETRIC_PRIV_KEY',
  'CREATE_ASYMMETRIC_PUB_KEY',
  'CREATE_DH_PARAMETERS',
  'CREATE_DIGEST',
  'CROSSES',
  'CURDATE',
  'CURTIME',
  'DATABASE',
  'DATE',
  'DATEDIFF',
  'DATE_ADD',
  'DATE_FORMAT',
  'DATE_SUB',
  'DAY',
  'DAYNAME',
  'DAYOFMONTH',
  'DAYOFWEEK',
  'DAYOFYEAR',
  'DECODE',
  'DEFAULT',
  'DEGREES',
  'DES_DECRYPT',
  'DES_ENCRYPT',
  'DIMENSION',
  'DISJOINT',
  'DISTANCE',
  'ELT',
  'ENCODE',
  'ENCRYPT',
  'ENDPOINT',
  'ENUM',
  'ENVELOPE',
  'EQUALS',
  'EXP',
  'EXPORT_SET',
  'EXTERIORRING',
  'EXTRACT',
  'EXTRACTVALUE',
  'FIELD',
  'FIND_IN_SET',
  'FLOOR',
  'FORMAT',
  'FOUND_ROWS',
  'FROM_BASE64',
  'FROM_DAYS',
  'FROM_UNIXTIME',
  'GEOMCOLLFROMTEXT',
  'GEOMCOLLFROMWKB',
  'GEOMETRYCOLLECTION',
  'GEOMETRYN',
  'GEOMETRYTYPE',
  'GEOMFROMTEXT',
  'GEOMFROMWKB',
  'GET_FORMAT',
  'GET_LOCK',
  'GLENGTH',
  'GREATEST',
  'GROUP_CONCAT',
  'GTID_SUBSET',
  'GTID_SUBTRACT',
  'HEX',
  'HOUR',
  'IF',
  'IFNULL',
  'INET6_ATON',
  'INET6_NTOA',
  'INET_ATON',
  'INET_NTOA',
  'INSERT',
  'INSTR',
  'INTERIORRINGN',
  'INTERSECTS',
  'INTERVAL',
  'ISCLOSED',
  'ISEMPTY',
  'ISNULL',
  'ISSIMPLE',
  'IS_FREE_LOCK',
  'IS_IPV4',
  'IS_IPV4_COMPAT',
  'IS_IPV4_MAPPED',
  'IS_IPV6',
  'IS_USED_LOCK',
  'JSON_APPEND',
  'JSON_ARRAY',
  'JSON_ARRAY_APPEND',
  'JSON_ARRAY_INSERT',
  'JSON_CONTAINS',
  'JSON_CONTAINS_PATH',
  'JSON_DEPTH',
  'JSON_EXTRACT',
  'JSON_INSERT',
  'JSON_KEYS',
  'JSON_LENGTH',
  'JSON_MERGE',
  'JSON_OBJECT',
  'JSON_QUOTE',
  'JSON_REMOVE',
  'JSON_REPLACE',
  'JSON_SEARCH',
  'JSON_SET',
  'JSON_TYPE',
  'JSON_UNQUOTE',
  'JSON_VALID',
  'LAST_DAY',
  'LAST_INSERT_ID',
  'LCASE',
  'LEAST',
  'LEFT',
  'LENGTH',
  'LINEFROMTEXT',
  'LINEFROMWKB',
  'LINESTRING',
  'LN',
  'LOAD_FILE',
  'LOCATE',
  'LOG',
  'LOG10',
  'LOG2',
  'LOWER',
  'LPAD',
  'LTRIM',
  'MAKEDATE',
  'MAKETIME',
  'MAKE_SET',
  'MASTER_POS_WAIT',
  'MAX',
  'MBRCONTAINS',
  'MBRCOVEREDBY',
  'MBRCOVERS',
  'MBRDISJOINT',
  'MBREQUAL',
  'MBREQUALS',
  'MBRINTERSECTS',
  'MBROVERLAPS',
  'MBRTOUCHES',
  'MBRWITHIN',
  'MD5',
  'MICROSECOND',
  'MID',
  'MIN',
  'MINUTE',
  'MLINEFROMTEXT',
  'MLINEFROMWKB',
  'MOD',
  'MONTH',
  'MONTHNAME',
  'MPOINTFROMTEXT',
  'MPOINTFROMWKB',
  'MPOLYFROMTEXT',
  'MPOLYFROMWKB',
  'MULTILINESTRING',
  'MULTIPOINT',
  'MULTIPOLYGON',
  'NAME_CONST',
  'NOW',
  'NULLIF',
  'NUMGEOMETRIES',
  'NUMINTERIORRINGS',
  'NUMPOINTS',
  'OCT',
  'OCTET_LENGTH',
  'OLD_PASSWORD',
  'ORD',
  'OVERLAPS',
  'PASSWORD',
  'PERIOD_ADD',
  'PERIOD_DIFF',
  'PI',
  'POINT',
  'POINTFROMTEXT',
  'POINTFROMWKB',
  'POINTN',
  'POLYFROMTEXT',
  'POLYFROMWKB',
  'POLYGON',
  'POSITION',
  'POW',
  'POWER',
  'PROCEDURE',
  'QUARTER',
  'QUOTE',
  'RADIANS',
  'RAND',
  'RANDOM_BYTES',
  'RELEASE_ALL_LOCKS',
  'RELEASE_LOCK',
  'REPEAT',
  'REPLACE',
  'REVERSE',
  'RIGHT',
  'ROUND',
  'ROW_COUNT',
  'RPAD',
  'RTRIM',
  'SCHEMA',
  'SECOND',
  'SEC_TO_TIME',
  'SESSION_USER',
  'SET',
  'SHA1',
  'SHA2',
  'SIGN',
  'SIN',
  'SLEEP',
  'SOUNDEX',
  'SPACE',
  'SQRT',
  'SRID',
  'STARTPOINT',
  'STD',
  'STDDEV',
  'STDDEV_POP',
  'STDDEV_SAMP',
  'STRCMP',
  'STR_TO_DATE',
  'ST_AREA',
  'ST_ASBINARY',
  'ST_ASGEOJSON',
  'ST_ASTEXT',
  'ST_BUFFER',
  'ST_BUFFER_STRATEGY',
  'ST_CENTROID',
  'ST_CONTAINS',
  'ST_CONVEXHULL',
  'ST_CROSSES',
  'ST_DIFFERENCE',
  'ST_DIMENSION',
  'ST_DISJOINT',
  'ST_DISTANCE',
  'ST_DISTANCE_SPHERE',
  'ST_ENDPOINT',
  'ST_ENVELOPE',
  'ST_EQUALS',
  'ST_EXTERIORRING',
  'ST_GEOHASH',
  'ST_GEOMCOLLFROMTEXT',
  'ST_GEOMCOLLFROMWKB',
  'ST_GEOMETRYN',
  'ST_GEOMETRYTYPE',
  'ST_GEOMFROMGEOJSON',
  'ST_GEOMFROMTEXT',
  'ST_GEOMFROMWKB',
  'ST_INTERIORRINGN',
  'ST_INTERSECTION',
  'ST_INTERSECTS',
  'ST_ISCLOSED',
  'ST_ISEMPTY',
  'ST_ISSIMPLE',
  'ST_ISVALID',
  'ST_LATFROMGEOHASH',
  'ST_LENGTH',
  'ST_LINEFROMTEXT',
  'ST_LINEFROMWKB',
  'ST_LONGFROMGEOHASH',
  'ST_MAKEENVELOPE',
  'ST_MLINEFROMTEXT',
  'ST_MLINEFROMWKB',
  'ST_MPOINTFROMTEXT',
  'ST_MPOINTFROMWKB',
  'ST_MPOLYFROMTEXT',
  'ST_MPOLYFROMWKB',
  'ST_NUMGEOMETRIES',
  'ST_NUMINTERIORRINGS',
  'ST_NUMPOINTS',
  'ST_OVERLAPS',
  'ST_POINTFROMGEOHASH',
  'ST_POINTFROMTEXT',
  'ST_POINTFROMWKB',
  'ST_POINTN',
  'ST_POLYFROMTEXT',
  'ST_POLYFROMWKB',
  'ST_SIMPLIFY',
  'ST_SRID',
  'ST_STARTPOINT',
  'ST_SYMDIFFERENCE',
  'ST_TOUCHES',
  'ST_UNION',
  'ST_VALIDATE',
  'ST_WITHIN',
  'ST_X',
  'ST_Y',
  'SUBDATE',
  'SUBSTR',
  'SUBSTRING',
  'SUBSTRING_INDEX',
  'SUBTIME',
  'SUM',
  'SYSDATE',
  'SYSTEM_USER',
  'TAN',
  'TIME',
  'TIMEDIFF',
  'TIMESTAMP',
  'TIMESTAMPADD',
  'TIMESTAMPDIFF',
  'TIME_FORMAT',
  'TIME_TO_SEC',
  'TOUCHES',
  'TO_BASE64',
  'TO_DAYS',
  'TO_SECONDS',
  'TRIM',
  'TRUNCATE',
  'UCASE',
  'UNCOMPRESS',
  'UNCOMPRESSED_LENGTH',
  'UNHEX',
  'UNIX_TIMESTAMP',
  'UPDATEXML',
  'UPPER',
  'USER',
  'UUID',
  'UUID_SHORT',
  'VALIDATE_PASSWORD_STRENGTH',
  'VALUES',
  'VARBINARY',
  'VARIANCE',
  'VAR_POP',
  'VAR_SAMP',
  'VERSION',
  'WAIT_FOR_EXECUTED_GTID_SET',
  'WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS',
  'WEEK',
  'WEEKDAY',
  'WEEKOFYEAR',
  'WEIGHT_STRING',
  'WITHIN',
  'X',
  'Y',
  'YEAR',
  'YEARWEEK',
  'CUME_DIST',
  'DENSE_RANK',
  'FIRST_VALUE',
  'LAG',
  'LAST_VALUE',
  'LEAD',
  'NTH_VALUE',
  'NTILE',
  'PERCENT_RANK',
  'RANK',
  'ROW_NUMBER',
  'STRING_AGG'
]

export default [
  ...list.map((token) => {
    return {
      name: token,
      token
    }
  })
]
