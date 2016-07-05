
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
true|false            return 'BOOL'
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

%% /* language grammar */

expressions
    : e EOF
        { return $1; }
    ;

e
    : e OR e
        {$$ = $1 || $3;}
    | e AND e
        {$$ = $1 && $3;}
    | NOT e
        {$$ = !$2;}
    | term '=' term
        {$$ = validator ? validator.compare($1, $2, $3) : (typeof $3 === 'boolean' ? $3 : $1 === $3);}
    | term '<>' term
        {$$ = validator ? validator.compare($1, $2, $3) : $1 !== $3;}
    | term IN term
        {$$ = validator ? validator.in($1, $3) : $3.indexOf($1) !== -1}
    | term NOT_IN term
        {$$ = validator ? validator.not_in($1, $3) : $3.indexOf($1) === -1}
    | term '>' term
        {$$ = validator ? validator.compare($1, $2, $3) : $1 > $3;}
    | term '>=' term
        {$$ = validator ? validator.compare($1, $2, $3) : $1 >= $3;}
    | term '<' term
        {$$ = validator ? validator.compare($1, $2, $3) : $1 < $3;}
    | term '<=' term
        {$$ = validator ? validator.compare($1, $2, $3) : $1 <= $3;}
    | '(' e ')'
        {$$ = $2;}
    ;

term
    : NUMBER
        {$$ = validator ? validator.number(Number(yytext)) : Number(yytext);}
    | BOOL
        {$$ = yytext === 'true'}
    | VARIABLE
        {$$ = validator ? validator.variable(yytext, data) : data[yytext];}
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