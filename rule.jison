
/* description: Parses and executes expressions. */

/*
 * For a simple expression, we support "=", "<>", "in", ">", ">=", "<", "<=" operators.
 * For a complex expression, we support to combine simple expressions together with these
 * oerpators: "or", "and", "not".
 *
 * @see more examples in test.js.
 *
 * @example:
 *
 * const parser = new require('rule-parser').Parser();
 * const expr = '(a = "") and (b in "str1, str2, str3") and (date >= 01/01/2016 and date <= 12/31/2016)';
 * parser.parse(expr, { a: '', b: 'str1', date: new Date() });
 */

/* lexical grammar */

%lex
%%

\s+                   /* skip whitespace */
'or'                  return 'OR'
'and'                 return 'AND'
'not in'              return 'NOT_IN'
"in"                  return 'IN'
'not'                 return 'NOT'
">="                  return '>='
"<="                  return '<='
"="                   return '='
"<>"                  return '<>'
">"                   return '>'
"<"                   return '<'


/* match date. http://www.regextester.com/6 */
/* ((0?[13578]|10|12)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[01]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1}))|(0?[2469]|11)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[0]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1})))
                      return 'DATE' */
\d{1,2}\/\d{1,2}\/\d{4}  return 'DATE'

[0-9]+("."[0-9]+)?\b  return 'NUMBER'
\"[^\"]*\"            return 'STRING'
[a-z]+                return 'VARIABLE'
\[.*?\]               return 'ARRAY'
"("                   return '('
")"                   return ')'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left AND OR
%right NOT
%left '=' '<>' '<' '<=' '>' '>=' IN


%start expressions
%parse-param data
%parse-param validator
%parse-param grammar

%% /* language grammar */

expressions
    : e EOF
        { return $1; }
    ;

e
    : e OR e
        {$$ = !grammar ? ($1 || $3) : [$1, 'or', $3];}
    | e AND e
        {$$ = !grammar ? ($1 && $3) : [$1, 'and', $3];}
    | NOT e
        {$$ = !grammar ? !$2 : [$2, 'not', null];}
    | term '=' term
        {$$ = !grammar ? ($1 === $3) : [$1, 'eq', $3];}
    | term '<>' term
        {$$ = !grammar ? ($1 !== $3) : [$1, 'neq', $3];}
    | term IN term
        {$$ = validator ? validator.in($1, $3) : (!grammar ? ($3.indexOf($1) !== -1) : [$1, 'in', $3])}
    | term NOT_IN term
        {$$ = validator ? validator.not_in($1, $3) : (!grammar ? ($3.indexOf($1) === -1) : [$1, 'nin', $3])}
    | term '>' term
        {$$ = !grammar ? $1 > $3 : [$1, 'gt', $3];}
    | term '>=' term
        {$$ = !grammar ? $1 >= $3 : [$1, 'gte', $3];}
    | term '<' term
        {$$ = !grammar ? $1 < $3 : [$1, 'lt', $3];}
    | term '<=' term
        {$$ = !grammar ? $1 <= $3 : [$1, 'lte', $3];}
    | '(' e ')'
        {$$ = $2;}
    ;

term
    : NUMBER
        {$$ = validator ? validator.number(Number(yytext)) : Number(yytext);}
    | VARIABLE
        {$$ = validator ? validator.variable(yytext, data) : !grammar ? data[yytext]: yytext;}
    | STRING
        {$$ = validator ? validator.string(JSON.parse(yytext)) : JSON.parse(yytext);}
    | ARRAY
        {$$ = validator ? validator.array(splitArray(yytext)) : splitArray(yytext);}
    | DATE
        {$$ = validator ? validator.date(yytext) : new Date(yytext);}
    ;

%%

function splitArray(input){
  return input.replace(/\[|\]+/g,'').split(',').map(function(item){return item ? JSON.parse(item.trim()): ''});
}

function _g() { return typeof grammar === 'undefined'; }
function _v() { return typeof validator !== 'undefined'; }

function isExpr(input) {
  return Array.isArray(input) && input.length === 3;
}

function toValue(input) {
  if (input instanceof Date) return (input.getMonth() + 1) + '/' + input.getDate() + '/' + input.getFullYear();
  return JSON.stringify(input);
}

function generate(input) {
  var lhs = isExpr(input[0]) ? generate(input[0]) : input[0];
  var op = input[1];
  var rhs = isExpr(input[2]) ? generate(input[2]) : toValue(input[2]);

  var _s = function(str) { return str; };
  switch (op) {
    case 'not'  : return _s('!(' + lhs + ')');
    case 'eq'   : return _s(lhs + ' = ' + rhs);
    case 'neq'  : return _s(lhs + ' <> ' + rhs);
    case 'in'   : return _s(lhs + ' in ' + rhs);
    case 'nin'  : return _s(lhs + ' not in ' + rhs);
    case 'gt'   : return _s(lhs + ' > ' + rhs);
    case 'gte'  : return _s(lhs + ' >= ' + rhs);
    case 'lt'   : return _s(lhs + ' < ' + rhs);
    case 'lte'  : return _s(lhs + ' <= ' + rhs);
    case 'and'  : return _s('(' + lhs + ' and ' + rhs + ')');
    case 'or'   : return _s('(' + lhs + ' or ' + rhs + ')');
    default:
      throw new Error('do not recognize:' + lhs + ', ' + op + ', ' + rhs);
  }
}

exports.generate = generate;
