
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
        {$$ = !grammar ? ($1 || $3) : {'or': [$1, $3]};}
    | e AND e
        {$$ = !grammar ? ($1 && $3) : {'and': [$1, $3]};}
    | NOT e
        {$$ = !grammar ? !$2 : {'not': $2};}
    | term '=' term
        {$$ = !grammar ? ($1 === $3) : {'eq': [$1, $3]};}
    | term '<>' term
        {$$ = !grammar ? ($1 !== $3) : {'neq': [$1, $3]};}
    | term IN term
        {$$ = validator ? validator.in($1, $3) : (!grammar ? ($3.indexOf($1) !== -1) : {'in': [$1, $3]})}
    | term NOT_IN term
        {$$ = validator ? validator.not_in($1, $3) : (!grammar ? ($3.indexOf($1) === -1) : {'nin': [$1, $3]})}
    | term '>' term
        {$$ = !grammar ? $1 > $3 : {'gt': [$1, $3]};}
    | term '>=' term
        {$$ = !grammar ? $1 >= $3 : {'gte': [$1, $3]};}
    | term '<' term
        {$$ = !grammar ? $1 < $3 : {'lt': [$1, $3]};}
    | term '<=' term
        {$$ = !grammar ? $1 <= $3 : {'lte': [$1, $3]};}
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
